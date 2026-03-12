import { titleCase, toTimestamp } from './utils.js'

const MAX_ALERTS = 8
const DEFAULT_THRESHOLDS = {
  agentStaleWarningMs: 10 * 60 * 1000,
  agentStaleCriticalMs: 30 * 60 * 1000,
  tokenWarningPercent: 80,
  tokenCriticalPercent: 90,
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

function isTlsTrustFailure(message) {
  const normalized = String(message || '').toLowerCase()

  return (
    normalized.includes('trust relationship') ||
    normalized.includes('self signed certificate') ||
    normalized.includes('unable to verify the first certificate') ||
    normalized.includes('unable to get local issuer certificate') ||
    normalized.includes('certificate has expired') ||
    normalized.includes("certificate's altnames") ||
    normalized.includes('hostname/ip does not match certificate') ||
    normalized.includes('secure channel') ||
    normalized.includes('cert_')
  )
}

function isPairingRequired(message) {
  return /pairing required/i.test(String(message || ''))
}

function sortAlerts(alerts) {
  const priority = {
    critical: 0,
    warning: 1,
    info: 2,
  }

  return [...alerts]
    .sort(
      (left, right) =>
        priority[left.severity] - priority[right.severity] ||
        left.title.localeCompare(right.title, 'zh-CN'),
    )
    .slice(0, MAX_ALERTS)
}

function joinMetaMethodNames(methodErrors = {}) {
  const labels = []

  if (methodErrors.status) {
    labels.push('status')
  }

  if (methodErrors.health) {
    labels.push('health')
  }

  if (methodErrors.systemPresence) {
    labels.push('system-presence')
  }

  return labels.length > 0 ? labels.join(' / ') : 'gateway meta'
}

function buildRemoteTlsAlert(gateway, severity = 'warning') {
  return {
    id: 'gateway-remote-tls',
    severity,
    title: '远程 Gateway 证书不受信',
    detail: `当前机器不信任 ${gateway?.gatewayUrl || 'OpenClaw Gateway'} 的 HTTPS/WSS 证书。请改用证书匹配的域名、导入根证书，或临时启用“忽略 TLS 证书校验”。`,
  }
}

function buildRemotePairingAlert(gateway, severity = 'warning', detailSuffix = '') {
  return {
    id: 'gateway-remote-pairing',
    severity,
    title: '远程 Gateway 需要设备配对',
    detail: `远程 ${gateway?.gatewayUrl || 'OpenClaw Gateway'} 尚未批准当前设备，请先在远端执行 devices approve。${detailSuffix}`.trim(),
  }
}

function buildDegradedGatewayAlert(gateway) {
  const details = Array.isArray(gateway?.metaErrors) ? gateway.metaErrors : []
  const methodLabel = joinMetaMethodNames(gateway?.metaMethodErrors)
  const combinedMessage = details.join(' ')

  if (isTlsTrustFailure(combinedMessage)) {
    return buildRemoteTlsAlert(gateway)
  }

  if (/security error|plaintext ws:\/\//i.test(combinedMessage)) {
    return {
      id: 'gateway-remote-security',
      severity: 'warning',
      title: '远程 Gateway 需要安全接入',
      detail: `远程 ${gateway.gatewayUrl || 'OpenClaw Gateway'} 拒绝明文 ws:// 访问，${methodLabel} 暂时不可用。请改用 wss://、SSH 隧道或 Tailscale。`,
    }
  }

  if (isPairingRequired(combinedMessage)) {
    return buildRemotePairingAlert(
      gateway,
      'warning',
      `${methodLabel} 暂时不可用。`,
    )
  }

  return {
    id: 'gateway-partial-data',
    severity: 'warning',
    title: 'OpenClaw Gateway 仅部分可用',
    detail: `${methodLabel} 当前不可用。看板还能显示角色和最近会话，但渠道、连接数和部分实时统计会缺失。`,
  }
}

export function normalizePresenceEntries(presenceData) {
  if (!Array.isArray(presenceData)) {
    return []
  }

  return [...presenceData]
    .filter((entry) => entry && typeof entry === 'object')
    .sort((left, right) => (right.ts || 0) - (left.ts || 0))
    .map((entry, index) => ({
      id: entry.instanceId || `${entry.host || 'presence'}-${entry.mode || 'unknown'}-${index}`,
      host: entry.host || 'unknown-host',
      ip: entry.ip || '',
      version: entry.version || '',
      platform: entry.platform || '',
      deviceFamily: entry.deviceFamily || '',
      modelIdentifier: entry.modelIdentifier || '',
      mode: entry.mode || 'unknown',
      reason: entry.reason || '',
      summary: entry.text || '',
      lastSeenAt: entry.ts ? new Date(entry.ts).toISOString() : null,
    }))
}

export function summarizeGatewayChannels(healthData) {
  const channels =
    healthData?.channels && typeof healthData.channels === 'object' ? healthData.channels : {}
  const channelOrder = Array.isArray(healthData?.channelOrder)
    ? healthData.channelOrder
    : Object.keys(channels)
  const labels =
    healthData?.channelLabels && typeof healthData.channelLabels === 'object'
      ? healthData.channelLabels
      : {}

  return channelOrder.map((channelId) => {
    const channel = channels[channelId] || {}
    const accountIds =
      channel.accounts && typeof channel.accounts === 'object'
        ? Object.keys(channel.accounts)
        : channel.accountId
          ? [channel.accountId]
          : []

    return {
      id: channelId,
      label: labels[channelId] || titleCase(channelId),
      configured: Boolean(channel.configured),
      healthy: Boolean(channel.probe?.ok),
      running: Boolean(channel.running),
      accountCount: accountIds.length,
      accountIds,
      lastError: channel.lastError || null,
    }
  })
}

function createEmptyMethodErrors() {
  return {
    status: null,
    health: null,
    systemPresence: null,
  }
}

export function createEmptyGatewayOverview(config, lastSuccessAt = null, lastError = null) {
  return {
    status: 'offline',
    connected: false,
    metaAvailable: false,
    metaErrors: [],
    metaMethodErrors: createEmptyMethodErrors(),
    gatewayUrl: config?.publicBaseUrl || '',
    defaultAgentId: null,
    activeSessionCount: null,
    totalSessionCount: null,
    configuredChannelCount: null,
    healthyChannelCount: null,
    connectionCount: null,
    heartbeatEvery: null,
    lastSuccessAt,
    lastError,
    channels: [],
  }
}

export function buildGatewayOverview(config, meta, lastSuccessAt, lastError) {
  if (!meta) {
    return createEmptyGatewayOverview(config, lastSuccessAt, lastError)
  }

  const statusAvailable = meta.statusAvailable === true
  const healthAvailable = meta.healthAvailable === true
  const presenceAvailable = meta.presenceAvailable === true
  const metaErrors = Array.isArray(meta.errors) ? [...new Set(meta.errors)] : []
  const metaMethodErrors =
    meta.methodErrors && typeof meta.methodErrors === 'object'
      ? {
          ...createEmptyMethodErrors(),
          ...meta.methodErrors,
        }
      : createEmptyMethodErrors()
  const metaAvailable = statusAvailable && healthAvailable && presenceAvailable
  const status = lastError
    ? 'offline'
    : lastSuccessAt
      ? metaAvailable
        ? 'connected'
        : 'degraded'
      : 'offline'
  const channels = healthAvailable ? summarizeGatewayChannels(meta.healthData) : []
  const heartbeatAgents = Array.isArray(meta.statusData?.heartbeat?.agents)
    ? meta.statusData.heartbeat.agents
    : []
  const defaultAgentId = statusAvailable
    ? meta.statusData?.defaultAgentId || meta.statusData?.heartbeat?.defaultAgentId || null
    : null
  const defaultHeartbeat =
    heartbeatAgents.find((entry) => entry.agentId === defaultAgentId) || heartbeatAgents[0] || null
  const totalSessionCount = statusAvailable
    ? Number.isFinite(meta.statusData?.sessions?.count)
      ? meta.statusData.sessions.count
      : Array.isArray(meta.statusData?.sessions?.recent)
        ? meta.statusData.sessions.recent.length
        : 0
    : null
  const activeSessionCount = statusAvailable
    ? Array.isArray(meta.statusData?.sessions?.recent)
      ? meta.statusData.sessions.recent.length
      : totalSessionCount
    : null
  const connections = presenceAvailable ? normalizePresenceEntries(meta.presenceData) : []

  return {
    status,
    connected: status === 'connected',
    metaAvailable,
    metaErrors,
    metaMethodErrors,
    gatewayUrl: config.publicBaseUrl,
    defaultAgentId,
    activeSessionCount,
    totalSessionCount,
    configuredChannelCount: healthAvailable ? channels.filter((entry) => entry.configured).length : null,
    healthyChannelCount: healthAvailable ? channels.filter((entry) => entry.healthy).length : null,
    connectionCount: presenceAvailable ? connections.length : null,
    heartbeatEvery: statusAvailable ? defaultHeartbeat?.every || null : null,
    lastSuccessAt,
    lastError,
    channels,
  }
}

export function buildAlerts({ agents, gateway, now, thresholds = {}, schemaWarnings = [] }) {
  const effectiveThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...thresholds,
  }
  const alerts = []

  if (gateway?.lastError) {
    if (isTlsTrustFailure(gateway.lastError)) {
      alerts.push(buildRemoteTlsAlert(gateway, 'critical'))
    } else if (isPairingRequired(gateway.lastError)) {
      alerts.push(buildRemotePairingAlert(gateway, 'critical'))
    } else {
      alerts.push({
        id: 'gateway-error',
        severity: 'critical',
        title: 'OpenClaw 网关刷新失败',
        detail: gateway.lastError,
      })
    }
  } else if (gateway?.status === 'degraded') {
    alerts.push(buildDegradedGatewayAlert(gateway))
  } else if (gateway?.gatewayUrl && gateway?.status === 'offline') {
    alerts.push({
      id: 'gateway-disconnected',
      severity: 'warning',
      title: 'OpenClaw 网关未连接',
      detail: '当前看板无法确认最新房间状态，请检查网关地址、令牌和服务状态。',
    })
  }

  const unhealthyChannels = Array.isArray(gateway?.channels)
    ? gateway.channels.filter((channel) => channel.configured && !channel.healthy)
    : []

  if (unhealthyChannels.length > 0) {
    const channelNames = unhealthyChannels.map((channel) => channel.label).join('、')
    const detail = unhealthyChannels
      .map((channel) => channel.lastError || `${channel.label} 健康检查失败`)
      .join('；')

    alerts.push({
      id: 'gateway-channels-unhealthy',
      severity: gateway?.healthyChannelCount === 0 ? 'critical' : 'warning',
      title: gateway?.healthyChannelCount === 0 ? '所有接入渠道异常' : '部分接入渠道异常',
      detail: `异常渠道：${channelNames}。${detail}`,
    })
  }

  const defaultAgent =
    agents.find((agent) => agent.id === gateway?.defaultAgentId) ||
    agents.find((agent) => agent.isDefault) ||
    agents[0] ||
    null
  const defaultAgentLastSeenAt = toTimestamp(defaultAgent?.lastSeenAt)

  if (gateway?.status !== 'offline' && defaultAgent && defaultAgentLastSeenAt != null) {
    const ageMs = Math.max(0, now - defaultAgentLastSeenAt)

    if (ageMs >= effectiveThresholds.agentStaleWarningMs) {
      alerts.push({
        id: `agent-stale-${defaultAgent.id}`,
        severity:
          ageMs >= effectiveThresholds.agentStaleCriticalMs ? 'critical' : 'warning',
        title:
          ageMs >= effectiveThresholds.agentStaleCriticalMs
            ? `${defaultAgent.name} 长时间无活动`
            : `${defaultAgent.name} 最近活动偏少`,
        detail: `${defaultAgent.name} 上次活跃在 ${formatRelativeWindow(defaultAgentLastSeenAt, now)}。`,
      })
    }
  }

  for (const agent of agents) {
    const percentUsed = agent.runtime?.percentUsed
    const remainingTokens = agent.runtime?.remainingTokens
    const tokenMetricsFresh = agent.runtime?.tokenMetricsFresh
    const hasTokenUsage =
      Number.isFinite(agent.runtime?.inputTokens) ||
      Number.isFinite(agent.runtime?.outputTokens) ||
      Number.isFinite(agent.runtime?.totalTokens)

    if (Number.isFinite(percentUsed) && percentUsed >= effectiveThresholds.tokenWarningPercent) {
      const detail =
        Number.isFinite(remainingTokens) && remainingTokens >= 0
          ? `${agent.name} 已使用 ${percentUsed}% 上下文，剩余 ${remainingTokens} 令牌。`
          : `${agent.name} 已使用 ${percentUsed}% 上下文。`

      alerts.push({
        id: `token-pressure-${agent.id}`,
        severity:
          percentUsed >= effectiveThresholds.tokenCriticalPercent ? 'critical' : 'warning',
        title:
          percentUsed >= effectiveThresholds.tokenCriticalPercent
            ? `${agent.name} 上下文即将耗尽`
            : `${agent.name} 上下文占用偏高`,
        detail,
      })
    }

    if (
      tokenMetricsFresh === false &&
      hasTokenUsage &&
      agent.status !== 'sleeping' &&
      agent.status !== 'offline'
    ) {
      alerts.push({
        id: `token-metrics-stale-${agent.id}`,
        severity: 'warning',
        title: `${agent.name} 会话统计未刷新`,
        detail:
          'OpenClaw 没有返回 fresh token metrics，可能是上游模型响应异常、会话仍在处理中，或统计尚未回填。',
      })
    }

    if (agent.runtime?.abortedLastRun) {
      alerts.push({
        id: `aborted-last-run-${agent.id}`,
        severity: 'warning',
        title: `${agent.name} 上一轮执行被中断`,
        detail: '建议检查最近一次任务日志或会话转录，确认是否存在超时或手动中止。',
      })
    }
  }

  if (schemaWarnings.length > 0) {
    const summary = [...new Set(schemaWarnings)].slice(0, 3).join(' ')
    alerts.push({
      id: 'gateway-schema-warning',
      severity: 'warning',
      title: 'OpenClaw 数据结构出现异常',
      detail:
        schemaWarnings.length > 3
          ? `${summary} 另有 ${schemaWarnings.length - 3} 项结构异常已被忽略。`
          : summary,
    })
  }

  return sortAlerts(alerts)
}
