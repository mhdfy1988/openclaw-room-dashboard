export type AgentStatus = 'sleeping' | 'idle' | 'working' | 'thinking' | 'offline'

export type AgentRole = 'controller' | 'work' | 'study'

export type AgentRuntime = {
  sessionKey: string
  sessionId?: string | null
  sessionKind?: string | null
  channel?: string | null
  displayName?: string | null
  accountId?: string | null
  lastTarget?: string | null
  model?: string | null
  contextTokens?: number | null
  totalTokens?: number | null
  inputTokens?: number | null
  outputTokens?: number | null
  remainingTokens?: number | null
  percentUsed?: number | null
  tokenMetricsFresh?: boolean | null
  transcriptPath?: string | null
  abortedLastRun?: boolean
}

export type Agent = {
  id: string
  name: string
  role: AgentRole
  emoji: string
  fallbackIcon?: string
  theme: string
  status: AgentStatus
  activityLabel: string
  currentTask?: string
  isDefault: boolean
  canDispatchTo?: string[]
  lastSeenAt?: string
  roomZone: string
  runtime?: AgentRuntime | null
}

export type RoomEvent = {
  id: string
  agentId: string
  type: string
  text: string
  at: string
}

export type RoomAlertSeverity = 'critical' | 'warning' | 'info'

export type RoomAlert = {
  id: string
  severity: RoomAlertSeverity
  title: string
  detail: string
}

export type GatewayChannel = {
  id: string
  label: string
  configured: boolean
  healthy: boolean
  running: boolean
  accountCount: number
  accountIds: string[]
  lastError?: string | null
}

export type GatewayOverview = {
  status: 'connected' | 'degraded' | 'offline'
  connected: boolean
  metaAvailable: boolean
  metaErrors: string[]
  metaMethodErrors: {
    status?: string | null
    health?: string | null
    systemPresence?: string | null
  }
  gatewayUrl: string
  defaultAgentId?: string | null
  activeSessionCount: number | null
  totalSessionCount: number | null
  configuredChannelCount: number | null
  healthyChannelCount: number | null
  connectionCount: number | null
  heartbeatEvery?: string | null
  lastSuccessAt?: string | null
  lastError?: string | null
  channels: GatewayChannel[]
}

export type GatewayConnection = {
  id: string
  host: string
  ip?: string
  version?: string
  platform?: string
  deviceFamily?: string
  modelIdentifier?: string
  mode: string
  reason?: string
  summary?: string
  lastSeenAt?: string | null
}

export type RoomState = {
  updatedAt: string
  roomMode: 'day' | 'night'
  agents: Agent[]
  events: RoomEvent[]
  gateway: GatewayOverview
  connections: GatewayConnection[]
  alerts: RoomAlert[]
}

export type RoomStreamState =
  | 'connecting'
  | 'live'
  | 'stream-error'
  | 'refresh-error'
  | 'initial-error'

export type ZoneKey = 'center-console' | 'work-desk' | 'study-desk' | 'sofa' | 'bed'

export type ZoneMeta = {
  key: ZoneKey
  title: string
  icon: string
  subtitle: string
  accentLabel?: string
}

export type StudyDeskVisualState = {
  occupied: boolean
  selected: boolean
  status: AgentStatus
  thoughtCue: boolean
}

export type RoomSummary = {
  totalAgents: number
  onlineAgents: number
  activeAgents: number
  sleepingAgents: number
  occupiedZones: ZoneMeta[]
}
