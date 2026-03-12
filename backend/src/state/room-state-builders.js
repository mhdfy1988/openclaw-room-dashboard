import { createEmptyGatewayOverview } from '../providers/openclaw/alerts.js'

export function createGatewayOverviewState(overrides = {}) {
  return {
    ...createEmptyGatewayOverview({ publicBaseUrl: '' }),
    ...overrides,
  }
}

export function createRoomStateEnvelope({
  now = Date.now(),
  updatedAt = new Date(now).toISOString(),
  roomMode = 'day',
  agents = [],
  events = [],
  gateway = {},
  connections = [],
  alerts = [],
} = {}) {
  return {
    updatedAt,
    roomMode,
    agents,
    events,
    gateway: createGatewayOverviewState(gateway),
    connections,
    alerts,
  }
}
