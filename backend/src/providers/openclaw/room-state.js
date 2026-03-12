import {
  buildAlerts,
  buildGatewayOverview,
  createEmptyGatewayOverview,
  normalizePresenceEntries,
} from './alerts.js'
import {
  createEmptyGatewayMeta,
  normalizeGatewayMeta,
  normalizeGatewaySnapshot,
} from './normalizers.js'
import { cloneState, titleCase } from './utils.js'

const ACTIVE_MS = 2 * 60 * 1000
const THINKING_MS = 10 * 60 * 1000
const IDLE_MS = 6 * 60 * 60 * 1000
const SLEEPING_MS = 3 * 24 * 60 * 60 * 1000
const MAX_EVENTS = 6

const ACTIVE_ROLE_ZONES = {
  controller: 'center-console',
  work: 'work-desk',
  study: 'study-desk',
}

function extractAgentIdFromSessionKey(sessionKey) {
  if (typeof sessionKey !== 'string' || !sessionKey.startsWith('agent:')) {
    return null
  }

  const parts = sessionKey.split(':')
  return parts[1] || null
}

function inferRole(agentId, defaultAgentId, index) {
  if (agentId === defaultAgentId || index === 0) {
    return 'controller'
  }

  return index % 2 === 0 ? 'study' : 'work'
}

function inferZone(role, status) {
  if (status === 'idle') {
    return 'sofa'
  }

  if (status === 'sleeping' || status === 'offline') {
    return 'bed'
  }

  return ACTIVE_ROLE_ZONES[role] || 'sofa'
}

function inferStatus(updatedAt, now) {
  if (!updatedAt) {
    return 'offline'
  }

  const ageMs = now - updatedAt

  if (ageMs <= ACTIVE_MS) {
    return 'working'
  }

  if (ageMs <= THINKING_MS) {
    return 'thinking'
  }

  if (ageMs <= IDLE_MS) {
    return 'idle'
  }

  if (ageMs <= SLEEPING_MS) {
    return 'sleeping'
  }

  return 'offline'
}

function formatRelativeWindow(updatedAt, now) {
  if (!updatedAt) {
    return '未知'
  }

  const ageMs = Math.max(0, now - updatedAt)
  const minutes = Math.round(ageMs / 60000)

  if (minutes < 1) {
    return '刚刚'
  }

  if (minutes < 60) {
    return `${minutes} 分钟前`
  }

  const hours = Math.round(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }

  const days = Math.round(hours / 24)
  return `${days} 天前`
}

function describeActivity(session, status, now) {
  const channel =
    session?.channel || session?.lastChannel || session?.deliveryContext?.channel || '未知通道'
  const relative = formatRelativeWindow(session?.updatedAt, now)

  if (status === 'working') {
    return `正在 ${channel}`
  }

  if (status === 'thinking') {
    return `${channel} 处理中`
  }

  if (status === 'idle') {
    return `在 ${channel} 待命`
  }

  if (status === 'sleeping') {
    return `${relative} 进入休眠`
  }

  return `${channel} 已离线`
}

function describeTask(session, statusSession) {
  if (!session && !statusSession) {
    return '暂无活跃会话'
  }

  const channel =
    session?.channel || session?.lastChannel || session?.deliveryContext?.channel || '未知通道'
  const model = session?.model || statusSession?.model || '未知模型'
  const totalTokens = session?.totalTokens ?? statusSession?.totalTokens ?? null
  const tokens = Number.isFinite(totalTokens) ? `${totalTokens} 令牌` : null

  return [channel, model, tokens].filter(Boolean).join(' · ')
}

function buildEvents(agentRows, nowIso, defaultAgentId) {
  const recentSessions = agentRows
    .flatMap((row) =>
      (Array.isArray(row.sessions) ? row.sessions : [])
        .filter((session) => session?.updatedAt)
        .map((session) => ({
          agentId: row.id,
          agentName: row.name,
          session,
        })),
    )
    .sort((left, right) => right.session.updatedAt - left.session.updatedAt)
    .slice(0, MAX_EVENTS)

  if (recentSessions.length === 0) {
    return [
      {
        id: 'openclaw-empty',
        agentId: defaultAgentId || 'main',
        type: 'gateway',
        text: 'OpenClaw 已连接，但当前没有活跃会话。',
        at: nowIso,
      },
    ]
  }

  return recentSessions.map(({ agentId, agentName, session }, index) => {
    const channel = session.channel || session.lastChannel || session.deliveryContext?.channel || '未知通道'
    const model = session.model || '未知模型'

    return {
      id: session.sessionId || session.key || `evt-${agentId}-${index}`,
      agentId,
      type: 'session',
      text: `${agentName} 在 ${channel} 使用 ${model}。`,
      at: new Date(session.updatedAt).toISOString(),
    }
  })
}

function buildStatusSessionIndex(statusData) {
  const byKey = new Map()
  const bySessionId = new Map()
  const recentLists = [
    ...(Array.isArray(statusData?.sessions?.recent) ? [statusData.sessions.recent] : []),
    ...(Array.isArray(statusData?.agents)
      ? statusData.agents.map((agent) => agent.sessions?.recent).filter(Array.isArray)
      : []),
  ]

  for (const list of recentLists) {
    for (const item of list) {
      if (item?.key && !byKey.has(item.key)) {
        byKey.set(item.key, item)
      }

      if (item?.sessionId && !bySessionId.has(item.sessionId)) {
        bySessionId.set(item.sessionId, item)
      }
    }
  }

  return { byKey, bySessionId }
}

export async function readGatewaySnapshot(client) {
  const [sessionsData, agentsData] = await Promise.all([
    client.invokeTool('sessions_list', { limit: 100 }),
    client.invokeTool('agents_list', {}).catch(() => ({ agents: [] })),
  ])

  return normalizeGatewaySnapshot({
    sessionsData,
    agentsData,
  })
}

export async function readGatewayMeta(client) {
  const [statusResult, healthResult, presenceResult] = await Promise.allSettled([
    client.callGatewayMethod('status'),
    client.callGatewayMethod('health'),
    client.callGatewayMethod('system-presence'),
  ])

  return normalizeGatewayMeta({
    statusData: statusResult.status === 'fulfilled' ? statusResult.value : null,
    healthData: healthResult.status === 'fulfilled' ? healthResult.value : null,
    presenceData: presenceResult.status === 'fulfilled' ? presenceResult.value : [],
    errors: {
      status:
        statusResult.status === 'rejected' ? statusResult.reason?.message || String(statusResult.reason) : null,
      health:
        healthResult.status === 'rejected' ? healthResult.reason?.message || String(healthResult.reason) : null,
      systemPresence:
        presenceResult.status === 'rejected'
          ? presenceResult.reason?.message || String(presenceResult.reason)
          : null,
    },
  })
}

export async function fetchOpenClawRoomState(client, config, now, meta) {
  const { sessionsData, agentsData, warnings: snapshotWarnings } = await readGatewaySnapshot(client)
  const configuredAgents = Array.isArray(agentsData.agents) ? agentsData.agents : []
  const defaultAgentId =
    agentsData.requester ||
    meta?.statusData?.defaultAgentId ||
    configuredAgents[0]?.id ||
    extractAgentIdFromSessionKey(sessionsData.sessions?.[0]?.key) ||
    'main'

  const groupedSessions = new Map()

  for (const session of Array.isArray(sessionsData.sessions) ? sessionsData.sessions : []) {
    const agentId = extractAgentIdFromSessionKey(session.key) || defaultAgentId
    const bucket = groupedSessions.get(agentId) || []
    bucket.push(session)
    groupedSessions.set(agentId, bucket)
  }

  for (const sessionList of groupedSessions.values()) {
    sessionList.sort((left, right) => (right.updatedAt || 0) - (left.updatedAt || 0))
  }

  const statusSessionIndex = buildStatusSessionIndex(meta?.statusData)
  const agentIndex = new Map()

  const registerAgent = (agentId, agentMeta) => {
    if (!agentId || agentIndex.has(agentId)) {
      return
    }

    agentIndex.set(agentId, {
      id: agentId,
      name: agentMeta?.name?.trim() || titleCase(agentId),
      configured: Boolean(agentMeta?.configured),
      latestSession: groupedSessions.get(agentId)?.[0],
      sessions: groupedSessions.get(agentId) || [],
    })
  }

  registerAgent(defaultAgentId, configuredAgents.find((agent) => agent.id === defaultAgentId))

  for (const agent of configuredAgents) {
    registerAgent(agent.id, agent)
  }

  for (const agentId of groupedSessions.keys()) {
    registerAgent(agentId, configuredAgents.find((agent) => agent.id === agentId))
  }

  const orderedAgents = Array.from(agentIndex.values()).sort((left, right) => {
    if (left.id === defaultAgentId) {
      return -1
    }

    if (right.id === defaultAgentId) {
      return 1
    }

    const leftUpdated = left.latestSession?.updatedAt || 0
    const rightUpdated = right.latestSession?.updatedAt || 0
    return rightUpdated - leftUpdated || left.id.localeCompare(right.id)
  })

  const agents = orderedAgents.map((agent, index) => {
    const latestUpdatedAt = agent.latestSession?.updatedAt
    const status = inferStatus(latestUpdatedAt, now)
    const role = inferRole(agent.id, defaultAgentId, index)
    const statusSession =
      (agent.latestSession?.sessionId &&
        statusSessionIndex.bySessionId.get(agent.latestSession.sessionId)) ||
      (agent.latestSession?.key && statusSessionIndex.byKey.get(agent.latestSession.key)) ||
      null

    const runtime = agent.latestSession
      ? {
          sessionKey: agent.latestSession.key,
          sessionId: agent.latestSession.sessionId || null,
          sessionKind: agent.latestSession.kind || null,
          channel:
            agent.latestSession.channel ||
            agent.latestSession.lastChannel ||
            agent.latestSession.deliveryContext?.channel ||
            null,
          displayName: agent.latestSession.displayName || null,
          accountId:
            agent.latestSession.lastAccountId ||
            agent.latestSession.deliveryContext?.accountId ||
            null,
          lastTarget:
            agent.latestSession.lastTo ||
            agent.latestSession.deliveryContext?.to ||
            null,
          model: agent.latestSession.model || statusSession?.model || null,
          contextTokens: agent.latestSession.contextTokens ?? statusSession?.contextTokens ?? null,
          totalTokens: agent.latestSession.totalTokens ?? statusSession?.totalTokens ?? null,
          inputTokens: statusSession?.inputTokens ?? null,
          outputTokens: statusSession?.outputTokens ?? null,
          remainingTokens: statusSession?.remainingTokens ?? null,
          percentUsed: statusSession?.percentUsed ?? null,
          tokenMetricsFresh: statusSession?.totalTokensFresh ?? null,
          transcriptPath: agent.latestSession.transcriptPath || null,
          abortedLastRun:
            agent.latestSession.abortedLastRun ?? statusSession?.abortedLastRun ?? false,
        }
      : null

    return {
      id: agent.id,
      name: agent.name,
      role,
      emoji: '',
      fallbackIcon: '',
      theme: 'openclaw-agent',
      status,
      activityLabel: describeActivity(agent.latestSession, status, now),
      currentTask: describeTask(agent.latestSession, statusSession),
      isDefault: agent.id === defaultAgentId,
      canDispatchTo:
        agent.id === defaultAgentId
          ? orderedAgents.filter((entry) => entry.id !== defaultAgentId).map((entry) => entry.id)
          : [],
      lastSeenAt: latestUpdatedAt ? new Date(latestUpdatedAt).toISOString() : undefined,
      roomZone: inferZone(role, status),
      runtime,
    }
  })

  const updatedAt = new Date(now).toISOString()
  const roomMode = agents.some((agent) => agent.status === 'working' || agent.status === 'thinking')
    ? 'day'
    : 'night'
  const gateway = buildGatewayOverview(config, meta, updatedAt, null)
  const connections = normalizePresenceEntries(meta?.presenceData)
  const alerts = buildAlerts({
    agents,
    gateway,
    now,
    thresholds: config.alertThresholds,
    schemaWarnings: [...(snapshotWarnings || []), ...(meta?.warnings || [])],
  })

  return {
    updatedAt,
    roomMode,
    agents,
    events: buildEvents(orderedAgents, updatedAt, defaultAgentId),
    gateway,
    connections,
    alerts,
  }
}

export function createGatewayErrorState(config, error, now, meta = null) {
  const updatedAt = new Date(now).toISOString()
  const agents = [
    {
      id: 'openclaw-gateway',
      name: 'OpenClaw 网关',
      role: 'controller',
      emoji: '',
      fallbackIcon: '',
      theme: 'openclaw-error',
      status: 'offline',
      activityLabel: '网关不可达',
      currentTask: error.message,
      isDefault: true,
      canDispatchTo: [],
      lastSeenAt: undefined,
      roomZone: 'center-console',
      runtime: null,
    },
  ]
  const gateway = buildGatewayOverview(config, meta, null, error.message)
  const connections = normalizePresenceEntries(meta?.presenceData)
  const alerts = buildAlerts({
    agents,
    gateway,
    now,
    thresholds: config.alertThresholds,
    schemaWarnings: [...(meta?.warnings || [])],
  })

  return {
    updatedAt,
    roomMode: 'night',
    agents,
    events: [
      {
        id: 'openclaw-gateway-error',
        agentId: 'openclaw-gateway',
        type: 'gateway-error',
        text: `无法连接到 ${config.publicBaseUrl} 的 OpenClaw 网关。`,
        at: updatedAt,
      },
    ],
    gateway,
    connections,
    alerts,
  }
}

export function addGatewayErrorEvent(state, error, now) {
  const next = cloneState(state)
  const updatedAt = new Date(now).toISOString()

  next.updatedAt = updatedAt
  next.gateway = {
    ...(next.gateway || createEmptyGatewayOverview({ publicBaseUrl: '' })),
    status: 'offline',
    connected: false,
    lastError: error.message,
  }
  next.events = [
    {
      id: 'openclaw-gateway-error',
      agentId: next.agents[0]?.id || 'openclaw-gateway',
      type: 'gateway-error',
      text: `OpenClaw 刷新失败：${error.message}`,
      at: updatedAt,
    },
    ...next.events.filter((event) => event.id !== 'openclaw-gateway-error').slice(0, MAX_EVENTS - 1),
  ]
  next.alerts = buildAlerts({
    agents: next.agents || [],
    gateway: next.gateway || createEmptyGatewayOverview({ publicBaseUrl: '' }),
    now,
    thresholds: {},
  })

  return next
}
