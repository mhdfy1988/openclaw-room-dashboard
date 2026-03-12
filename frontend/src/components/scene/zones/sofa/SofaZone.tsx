import type { Agent, ZoneMeta } from '../../../../types/room'
import { ZoneCard } from '../../ZoneCard'

type SofaZoneProps = {
  zone: ZoneMeta
  agents: Agent[]
  selectedAgentId?: string | null
  onSelectAgent: (id: string) => void
}

export function SofaZone({ zone, agents, selectedAgentId, onSelectAgent }: SofaZoneProps) {
  return (
    <ZoneCard
      zone={zone}
      agents={agents}
      selectedAgentId={selectedAgentId}
      onSelectAgent={onSelectAgent}
    />
  )
}
