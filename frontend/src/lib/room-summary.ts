import { getDashboardAgentMetrics } from './dashboard-selectors'
import type { Agent, RoomSummary, ZoneMeta } from '../types/room'

export function buildRoomSummary(
  agents: Agent[],
  zoneMap: Map<string, Agent[]>,
  zones: ZoneMeta[],
): RoomSummary {
  const metrics = getDashboardAgentMetrics(agents)
  const occupiedZones = zones.filter((zone) => (zoneMap.get(zone.key) ?? []).length > 0)

  return {
    ...metrics,
    occupiedZones,
  }
}
