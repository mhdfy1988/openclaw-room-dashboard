import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const DEFAULT_OPENCLAW_TIMEOUT_MS = 6000
export const DEFAULT_OPENCLAW_ALERT_THRESHOLDS = {
  agentStaleWarningMs: 10 * 60 * 1000,
  agentStaleCriticalMs: 30 * 60 * 1000,
  tokenWarningPercent: 80,
  tokenCriticalPercent: 90,
}
export const DEFAULT_OPENCLAW_CONFIG = {
  enabled: true,
  url: '',
  token: '',
  sessionKey: 'main',
  timeoutMs: DEFAULT_OPENCLAW_TIMEOUT_MS,
  messageChannel: '',
  accountId: '',
  allowInsecureTls: false,
  alertThresholds: DEFAULT_OPENCLAW_ALERT_THRESHOLDS,
}

const DEFAULT_CONFIG_FILE = path.resolve(__dirname, '../openclaw.config.local.json')

function parseBoolean(value) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return undefined
}

function parseNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : undefined
}

function normalizeOptionalString(value) {
  const normalized = normalizeString(value)
  return normalized ? normalized : undefined
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined) {
      return value
    }
  }

  return undefined
}

function ensurePositiveTimeout(value, fallback = DEFAULT_OPENCLAW_TIMEOUT_MS) {
  const parsed = parseNumber(value)
  return parsed && parsed > 0 ? Math.round(parsed) : fallback
}

function ensureNonNegativeNumber(value, fallback) {
  const parsed = parseNumber(value)
  return parsed != null && parsed >= 0 ? Math.round(parsed) : fallback
}

function ensurePercent(value, fallback) {
  const parsed = parseNumber(value)
  if (parsed == null) {
    return fallback
  }

  return Math.max(0, Math.min(100, Math.round(parsed)))
}

export function getOpenClawConfigFilePath(env = process.env) {
  return normalizeOptionalString(env.OPENCLAW_CONFIG_FILE) || DEFAULT_CONFIG_FILE
}

function readConfigFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      filePath,
      data: {},
      error: null,
    }
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(raw)

    return {
      exists: true,
      filePath,
      data: data && typeof data === 'object' ? data : {},
      error: null,
    }
  } catch (error) {
    return {
      exists: true,
      filePath,
      data: {},
      error: `Failed to parse ${filePath}: ${error.message}`,
    }
  }
}

function coerceUrl(rawUrl) {
  if (/^[a-z]+:\/\//i.test(rawUrl)) {
    return new URL(rawUrl)
  }

  return new URL(`http://${rawUrl}`)
}

export function splitTokenizedGatewayUrl(rawUrl) {
  const url = coerceUrl(rawUrl.trim())
  let token = url.searchParams.get('token') ?? null

  if (token) {
    url.searchParams.delete('token')
  }

  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.slice(1))
    token = token ?? hashParams.get('token')
    url.hash = ''
  }

  return { url, token }
}

export function normalizeGatewayBaseUrl(rawUrl) {
  const { url, token } = splitTokenizedGatewayUrl(rawUrl)

  if (url.protocol === 'ws:') {
    url.protocol = 'http:'
  } else if (url.protocol === 'wss:') {
    url.protocol = 'https:'
  }

  url.username = ''
  url.password = ''
  url.hash = ''
  if (url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
  }

  return {
    baseUrl: url.toString().replace(/\/$/, ''),
    token,
  }
}

function mergeConfigValues(raw = {}, fallback = DEFAULT_OPENCLAW_CONFIG) {
  const rawUrl = normalizeString(raw.url) ?? fallback.url ?? ''
  const rawToken = normalizeOptionalString(raw.token)
  let url = rawUrl
  let extractedToken = undefined

  if (rawUrl) {
    const normalized = normalizeGatewayBaseUrl(rawUrl)
    url = normalized.baseUrl
    extractedToken = normalizeString(normalized.token ?? undefined)
  }

  const token = pickFirst(
    rawToken,
    extractedToken,
    fallback.token,
    DEFAULT_OPENCLAW_CONFIG.token,
  )
  const fallbackThresholds = fallback.alertThresholds || DEFAULT_OPENCLAW_ALERT_THRESHOLDS
  const rawThresholds =
    raw.alertThresholds && typeof raw.alertThresholds === 'object' ? raw.alertThresholds : {}

  return {
    enabled: pickFirst(parseBoolean(raw.enabled), fallback.enabled, DEFAULT_OPENCLAW_CONFIG.enabled),
    url,
    token,
    sessionKey: pickFirst(
      normalizeString(raw.sessionKey),
      fallback.sessionKey,
      DEFAULT_OPENCLAW_CONFIG.sessionKey,
    ),
    timeoutMs: ensurePositiveTimeout(raw.timeoutMs, fallback.timeoutMs ?? DEFAULT_OPENCLAW_TIMEOUT_MS),
    messageChannel: pickFirst(
      normalizeString(raw.messageChannel),
      fallback.messageChannel,
      DEFAULT_OPENCLAW_CONFIG.messageChannel,
    ),
    accountId: pickFirst(
      normalizeString(raw.accountId),
      fallback.accountId,
      DEFAULT_OPENCLAW_CONFIG.accountId,
    ),
    allowInsecureTls: pickFirst(
      parseBoolean(raw.allowInsecureTls),
      fallback.allowInsecureTls,
      DEFAULT_OPENCLAW_CONFIG.allowInsecureTls,
    ),
    alertThresholds: {
      agentStaleWarningMs: ensureNonNegativeNumber(
        rawThresholds.agentStaleWarningMs,
        fallbackThresholds.agentStaleWarningMs,
      ),
      agentStaleCriticalMs: ensureNonNegativeNumber(
        rawThresholds.agentStaleCriticalMs,
        fallbackThresholds.agentStaleCriticalMs,
      ),
      tokenWarningPercent: ensurePercent(
        rawThresholds.tokenWarningPercent,
        fallbackThresholds.tokenWarningPercent,
      ),
      tokenCriticalPercent: ensurePercent(
        rawThresholds.tokenCriticalPercent,
        fallbackThresholds.tokenCriticalPercent,
      ),
    },
  }
}

export function loadOpenClawFileConfig({ env = process.env } = {}) {
  const filePath = getOpenClawConfigFilePath(env)
  const file = readConfigFile(filePath)

  return {
    exists: file.exists,
    filePath: file.filePath,
    error: file.error,
    config: mergeConfigValues(file.data, DEFAULT_OPENCLAW_CONFIG),
  }
}

export function maskToken(token) {
  const trimmed = normalizeString(token)
  if (!trimmed) {
    return ''
  }

  if (trimmed.length <= 8) {
    return '*'.repeat(trimmed.length)
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`
}

export function sanitizeOpenClawConfigForClient(config) {
  const normalized = mergeConfigValues(config, DEFAULT_OPENCLAW_CONFIG)

  return {
    enabled: normalized.enabled,
    url: normalized.url,
    sessionKey: normalized.sessionKey,
    timeoutMs: normalized.timeoutMs,
    messageChannel: normalized.messageChannel,
    accountId: normalized.accountId,
    allowInsecureTls: normalized.allowInsecureTls,
    alertThresholds: normalized.alertThresholds,
    hasToken: Boolean(normalized.token),
    maskedToken: maskToken(normalized.token),
  }
}

export function saveOpenClawFileConfig(
  input,
  { env = process.env, preserveExistingToken = true } = {},
) {
  const current = loadOpenClawFileConfig({ env })
  const fallback = preserveExistingToken ? current.config : { ...current.config, token: '' }
  const next = mergeConfigValues(input, fallback)

  if (next.enabled && !next.url) {
    throw new Error('启用 OpenClaw 接入时必须填写地址')
  }

  const payload = {
    enabled: next.enabled,
    url: next.url,
    token: next.token,
    sessionKey: next.sessionKey,
    timeoutMs: next.timeoutMs,
    messageChannel: next.messageChannel,
    accountId: next.accountId,
    allowInsecureTls: next.allowInsecureTls,
    alertThresholds: next.alertThresholds,
  }

  fs.writeFileSync(current.filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  return {
    filePath: current.filePath,
    config: next,
  }
}

export function loadOpenClawIntegrationConfig({ env = process.env } = {}) {
  const file = loadOpenClawFileConfig({ env })

  const envEnabled = parseBoolean(env.OPENCLAW_ENABLED)
  const envUrl = normalizeOptionalString(env.OPENCLAW_URL)
  const envToken = normalizeOptionalString(env.OPENCLAW_TOKEN)
  const envSessionKey = normalizeOptionalString(env.OPENCLAW_SESSION_KEY)
  const envMessageChannel = normalizeOptionalString(env.OPENCLAW_MESSAGE_CHANNEL)
  const envAccountId = normalizeOptionalString(env.OPENCLAW_ACCOUNT_ID)
  const envAllowInsecureTls = parseBoolean(env.OPENCLAW_ALLOW_INSECURE_TLS)
  const envTimeoutMs = parseNumber(env.OPENCLAW_TIMEOUT_MS)
  const envAgentStaleWarningMs = parseNumber(env.OPENCLAW_AGENT_STALE_WARNING_MS)
  const envAgentStaleCriticalMs = parseNumber(env.OPENCLAW_AGENT_STALE_CRITICAL_MS)
  const envTokenWarningPercent = parseNumber(env.OPENCLAW_TOKEN_WARNING_PERCENT)
  const envTokenCriticalPercent = parseNumber(env.OPENCLAW_TOKEN_CRITICAL_PERCENT)

  const usesEnv =
    envEnabled !== undefined ||
    envUrl !== undefined ||
    envToken !== undefined ||
    envSessionKey !== undefined ||
    envMessageChannel !== undefined ||
    envAccountId !== undefined ||
    envAllowInsecureTls !== undefined ||
    envTimeoutMs !== undefined ||
    envAgentStaleWarningMs !== undefined ||
    envAgentStaleCriticalMs !== undefined ||
    envTokenWarningPercent !== undefined ||
    envTokenCriticalPercent !== undefined

  let source = 'none'
  if (usesEnv && file.exists) {
    source = 'env+file'
  } else if (usesEnv) {
    source = 'env'
  } else if (file.exists) {
    source = 'file'
  }

  return {
    enabled: pickFirst(envEnabled, file.config.enabled, undefined),
    url: pickFirst(envUrl, file.config.url, ''),
    token: pickFirst(envToken, file.config.token, ''),
    sessionKey: pickFirst(envSessionKey, file.config.sessionKey, DEFAULT_OPENCLAW_CONFIG.sessionKey),
    messageChannel: pickFirst(
      envMessageChannel,
      file.config.messageChannel,
      DEFAULT_OPENCLAW_CONFIG.messageChannel,
    ),
    accountId: pickFirst(envAccountId, file.config.accountId, DEFAULT_OPENCLAW_CONFIG.accountId),
    allowInsecureTls: pickFirst(
      envAllowInsecureTls,
      file.config.allowInsecureTls,
      DEFAULT_OPENCLAW_CONFIG.allowInsecureTls,
    ),
    timeoutMs: pickFirst(envTimeoutMs, file.config.timeoutMs, DEFAULT_OPENCLAW_TIMEOUT_MS),
    alertThresholds: {
      agentStaleWarningMs: ensureNonNegativeNumber(
        pickFirst(
          envAgentStaleWarningMs,
          file.config.alertThresholds?.agentStaleWarningMs,
          DEFAULT_OPENCLAW_ALERT_THRESHOLDS.agentStaleWarningMs,
        ),
        DEFAULT_OPENCLAW_ALERT_THRESHOLDS.agentStaleWarningMs,
      ),
      agentStaleCriticalMs: ensureNonNegativeNumber(
        pickFirst(
          envAgentStaleCriticalMs,
          file.config.alertThresholds?.agentStaleCriticalMs,
          DEFAULT_OPENCLAW_ALERT_THRESHOLDS.agentStaleCriticalMs,
        ),
        DEFAULT_OPENCLAW_ALERT_THRESHOLDS.agentStaleCriticalMs,
      ),
      tokenWarningPercent: ensurePercent(
        pickFirst(
          envTokenWarningPercent,
          file.config.alertThresholds?.tokenWarningPercent,
          DEFAULT_OPENCLAW_ALERT_THRESHOLDS.tokenWarningPercent,
        ),
        DEFAULT_OPENCLAW_ALERT_THRESHOLDS.tokenWarningPercent,
      ),
      tokenCriticalPercent: ensurePercent(
        pickFirst(
          envTokenCriticalPercent,
          file.config.alertThresholds?.tokenCriticalPercent,
          DEFAULT_OPENCLAW_ALERT_THRESHOLDS.tokenCriticalPercent,
        ),
        DEFAULT_OPENCLAW_ALERT_THRESHOLDS.tokenCriticalPercent,
      ),
    },
    source,
    configFilePath: file.filePath,
    configFileExists: file.exists,
    configError: file.error,
  }
}
