export type OpenClawAlertThresholds = {
  agentStaleWarningMs: number
  agentStaleCriticalMs: number
  tokenWarningPercent: number
  tokenCriticalPercent: number
}

export type OpenClawConfigView = {
  enabled: boolean
  url: string
  sessionKey: string
  timeoutMs: number
  messageChannel: string
  accountId: string
  alertThresholds: OpenClawAlertThresholds
  hasToken: boolean
  maskedToken: string
  filePath: string
  fileExists: boolean
  fileError: string | null
}

export type OpenClawHealth = {
  source: 'openclaw' | 'unconfigured' | 'mock'
  configured: boolean
  status: 'connected' | 'degraded' | 'offline'
  connected: boolean
  metaAvailable?: boolean
  metaErrors?: string[]
  gatewayUrl?: string
  sessionKey?: string
  configSource?: string
  configFilePath?: string
  fallbackMode?: 'mock' | 'empty'
  mockModeEnabled?: boolean
  alertThresholds?: OpenClawAlertThresholds
  schemaWarningCount?: number
  lastSuccessAt?: string | null
  lastError?: string | null
  activeSessionCount?: number | null
  healthyChannelCount?: number | null
  connectionCount?: number | null
}

export type OpenClawConfigResponse = {
  config: OpenClawConfigView
  health: OpenClawHealth
}

export type OpenClawConfigDraft = {
  enabled: boolean
  url: string
  token: string
  sessionKey: string
  timeoutMs: number
  messageChannel: string
  accountId: string
  alertThresholds: OpenClawAlertThresholds
  clearSavedToken: boolean
}

export type OpenClawTestResult = {
  gatewayUrl: string
  sessionKey: string
  agentCount: number
  sessionCount: number
  requester: string | null
  metaAvailable?: boolean
  connectionCount?: number | null
  healthyChannelCount?: number | null
}

export type OpenClawLinkDraft = Partial<
  Pick<OpenClawConfigDraft, 'enabled' | 'url' | 'token' | 'sessionKey'>
> & {
  notice?: string
}
