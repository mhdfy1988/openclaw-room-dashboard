import type { Agent } from '../types/room'

export function groupAgentsByZone(agents: Agent[]) {
  const grouped = new Map<string, Agent[]>()

  agents.forEach((agent) => {
    const current = grouped.get(agent.roomZone) ?? []
    current.push(agent)
    grouped.set(agent.roomZone, current)
  })

  return grouped
}
