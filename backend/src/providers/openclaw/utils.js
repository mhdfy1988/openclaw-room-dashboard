import {
  DEFAULT_OPENCLAW_TIMEOUT_MS,
  loadOpenClawIntegrationConfig,
  normalizeGatewayBaseUrl,
} from '../../config/openclaw-config.js'

export function asNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function toTimestamp(value) {
  if (value == null) {
    return null
  }

  const timestamp = typeof value === 'number' ? value : Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

export function createError(message, cause) {
  const error = new Error(message)

  if (cause) {
    error.cause = cause
  }

  return error
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state))
}

export function titleCase(value) {
  return value
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function resolveGatewayConfigFromIntegration(integration) {
  const rawUrl = integration.url?.trim()
  const explicitlyDisabled = integration.enabled === false

  if (explicitlyDisabled || !rawUrl) {
    return {
      enabled: false,
      sessionKey: integration.sessionKey || 'main',
      configSource: integration.source,
      configFilePath: integration.configFilePath,
      configError: integration.configError,
    }
  }

  const normalized = normalizeGatewayBaseUrl(rawUrl)

  return {
    enabled: true,
    baseUrl: normalized.baseUrl,
    publicBaseUrl: normalized.baseUrl,
    token: integration.token || normalized.token || '',
    sessionKey: integration.sessionKey || 'main',
    messageChannel: integration.messageChannel || '',
    accountId: integration.accountId || '',
    timeoutMs: asNumber(integration.timeoutMs, DEFAULT_OPENCLAW_TIMEOUT_MS),
    configSource: integration.source,
    configFilePath: integration.configFilePath,
    configError: integration.configError,
    alertThresholds: integration.alertThresholds,
  }
}

export function resolveGatewayConfig(env = process.env) {
  return resolveGatewayConfigFromIntegration(loadOpenClawIntegrationConfig({ env }))
}
