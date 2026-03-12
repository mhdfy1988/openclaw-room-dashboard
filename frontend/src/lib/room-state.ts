import type { RoomState } from '../types/room'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value != null
}

export function isRoomStatePayload(value: unknown): value is RoomState {
  if (!isRecord(value)) {
    return false
  }

  if (typeof value.updatedAt !== 'string') {
    return false
  }

  if (value.roomMode !== 'day' && value.roomMode !== 'night') {
    return false
  }

  if (!Array.isArray(value.agents) || !Array.isArray(value.events)) {
    return false
  }

  if (!Array.isArray(value.connections) || !Array.isArray(value.alerts)) {
    return false
  }

  if (!isRecord(value.gateway)) {
    return false
  }

  if (
    value.gateway.status !== 'connected' &&
    value.gateway.status !== 'degraded' &&
    value.gateway.status !== 'offline'
  ) {
    return false
  }

  if (typeof value.gateway.connected !== 'boolean') {
    return false
  }

  if (typeof value.gateway.metaAvailable !== 'boolean') {
    return false
  }

  if (!Array.isArray(value.gateway.metaErrors)) {
    return false
  }

  if (typeof value.gateway.gatewayUrl !== 'string') {
    return false
  }

  if (value.gateway.activeSessionCount != null && typeof value.gateway.activeSessionCount !== 'number') {
    return false
  }

  if (value.gateway.totalSessionCount != null && typeof value.gateway.totalSessionCount !== 'number') {
    return false
  }

  return true
}
