import { summarizeGatewayChannels } from './alerts.js'
import { createGatewayClient } from './client.js'
import { createEmptyGatewayMeta } from './normalizers.js'
import {
  addGatewayErrorEvent,
  createGatewayErrorState,
  fetchOpenClawRoomState,
  readGatewayMeta,
  readGatewaySnapshot,
} from './room-state.js'
import {
  cloneState,
  createError,
  resolveGatewayConfig,
  resolveGatewayConfigFromIntegration,
} from './utils.js'

const STATE_CACHE_TTL_MS = 2 * 1000
const META_CACHE_TTL_MS = 30 * 1000

export async function testOpenClawGatewayConfig(integration) {
  const config = resolveGatewayConfigFromIntegration({
    ...integration,
    source: 'request',
    configFilePath: integration.configFilePath,
    configError: null,
  })

  if (!config.enabled) {
    throw createError('测试连接前请先填写 OpenClaw 地址')
  }

  const client = createGatewayClient(config)
  const [snapshot, meta] = await Promise.all([
    readGatewaySnapshot(client),
    readGatewayMeta(client).catch(() => createEmptyGatewayMeta()),
  ])
  const channels = summarizeGatewayChannels(meta.healthData)
  const metaAvailable =
    meta.statusAvailable === true && meta.healthAvailable === true && meta.presenceAvailable === true

  return {
    gatewayUrl: config.publicBaseUrl,
    sessionKey: config.sessionKey,
    agentCount: Array.isArray(snapshot.agentsData.agents) ? snapshot.agentsData.agents.length : 0,
    sessionCount: Array.isArray(snapshot.sessionsData.sessions) ? snapshot.sessionsData.sessions.length : 0,
    requester:
      typeof snapshot.agentsData.requester === 'string' ? snapshot.agentsData.requester : null,
    metaAvailable,
    connectionCount: meta.presenceAvailable === true ? meta.presenceData.length : null,
    healthyChannelCount: meta.healthAvailable === true ? channels.filter((entry) => entry.healthy).length : null,
  }
}

function classifyRefreshFailure(error) {
  const message = String(error?.message || error || '').toLowerCase()

  if (message.includes('timed out') || message.includes('timeout')) {
    return 'timeout'
  }

  if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
    return 'auth'
  }

  if (message.includes('json') || message.includes('parse')) {
    return 'malformed-payload'
  }

  return 'unknown'
}

export function createOpenClawRoomStateProvider({ env = process.env, logger = null } = {}) {
  const runtime = {
    config: resolveGatewayConfig(env),
    client: null,
    cachedState: null,
    cachedAt: 0,
    inFlight: null,
    cachedMeta: null,
    metaCachedAt: 0,
    metaInFlight: null,
    lastSuccessAt: null,
    lastError: null,
  }

  function applyConfig(nextConfig) {
    runtime.config = nextConfig
    runtime.client = nextConfig.enabled ? createGatewayClient(nextConfig) : null
    runtime.cachedState = null
    runtime.cachedAt = 0
    runtime.inFlight = null
    runtime.cachedMeta = null
    runtime.metaCachedAt = 0
    runtime.metaInFlight = null
    runtime.lastSuccessAt = null
    runtime.lastError = nextConfig.configError || null
  }

  applyConfig(runtime.config)

  async function getGatewayMeta() {
    if (!runtime.client) {
      return createEmptyGatewayMeta()
    }

    const now = Date.now()
    if (runtime.cachedMeta && now - runtime.metaCachedAt < META_CACHE_TTL_MS) {
      return runtime.cachedMeta
    }

    if (!runtime.metaInFlight) {
      runtime.metaInFlight = readGatewayMeta(runtime.client)
        .then((meta) => {
          runtime.cachedMeta = meta
          runtime.metaCachedAt = Date.now()
          return meta
        })
        .catch((error) => {
          if (runtime.cachedMeta) {
            return runtime.cachedMeta
          }

          throw error
        })
        .finally(() => {
          runtime.metaInFlight = null
        })
    }

    return runtime.metaInFlight
  }

  async function loadState(now) {
    if (!runtime.client) {
      return null
    }

    const startedAt = Date.now()

    try {
      const meta = await getGatewayMeta().catch(() => createEmptyGatewayMeta())
      const state = await fetchOpenClawRoomState(runtime.client, runtime.config, now, meta)
      runtime.lastSuccessAt = state.updatedAt
      runtime.lastError = null

      logger?.info?.(
        {
          event: 'openclaw.refresh',
          gatewayUrl: runtime.config.publicBaseUrl,
          durationMs: Date.now() - startedAt,
          activeSessionCount: state.gateway?.activeSessionCount ?? 0,
          healthyChannelCount: state.gateway?.healthyChannelCount ?? 0,
          connectionCount: state.gateway?.connectionCount ?? 0,
          schemaWarningCount: meta?.warnings?.length ?? 0,
        },
        'openclaw refresh succeeded',
      )

      return state
    } catch (error) {
      logger?.warn?.(
        {
          event: 'openclaw.refresh',
          gatewayUrl: runtime.config.publicBaseUrl,
          durationMs: Date.now() - startedAt,
          failureReason: classifyRefreshFailure(error),
          errorMessage: error?.message || String(error),
        },
        'openclaw refresh failed',
      )
      throw error
    }
  }

  async function getState() {
    if (!runtime.client) {
      return null
    }

    const now = Date.now()
    if (runtime.cachedState && now - runtime.cachedAt < STATE_CACHE_TTL_MS) {
      return cloneState(runtime.cachedState)
    }

    if (!runtime.inFlight) {
      runtime.inFlight = loadState(now)
        .then((state) => {
          runtime.cachedState = state
          runtime.cachedAt = Date.now()
          return state
        })
        .catch((error) => {
          runtime.lastError = error.message

          if (runtime.cachedState) {
            return addGatewayErrorEvent(runtime.cachedState, error, now)
          }

          return createGatewayErrorState(runtime.config, error, now, runtime.cachedMeta)
        })
        .finally(() => {
          runtime.inFlight = null
        })
    }

    return cloneState(await runtime.inFlight)
  }

  function refreshConfig() {
    applyConfig(resolveGatewayConfig(env))
    return getHealthSnapshot()
  }

  function getHealthSnapshot() {
    const gateway = runtime.cachedState?.gateway
    const status = gateway?.status || (runtime.lastError ? 'offline' : runtime.lastSuccessAt ? 'degraded' : 'offline')

    return {
      source: runtime.config.enabled ? 'openclaw' : 'unconfigured',
      configured: runtime.config.enabled,
      status,
      connected: status === 'connected',
      metaAvailable: gateway?.metaAvailable ?? false,
      metaErrors: gateway?.metaErrors ?? [],
      gatewayUrl: runtime.config.publicBaseUrl,
      sessionKey: runtime.config.sessionKey,
      configSource: runtime.config.configSource,
      configFilePath: runtime.config.configFilePath,
      alertThresholds: runtime.config.alertThresholds,
      lastSuccessAt: runtime.lastSuccessAt,
      lastError: runtime.lastError,
      schemaWarningCount: runtime.cachedMeta?.warnings?.length ?? 0,
      activeSessionCount: gateway?.activeSessionCount ?? null,
      healthyChannelCount: gateway?.healthyChannelCount ?? null,
      connectionCount: gateway?.connectionCount ?? null,
    }
  }

  return {
    get isConfigured() {
      return runtime.config.enabled
    },
    getState,
    refreshConfig,
    getHealthSnapshot,
  }
}
