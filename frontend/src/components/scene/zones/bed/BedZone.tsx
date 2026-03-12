import type { Agent, ZoneMeta } from '../../../../types/room'
import { ZoneCard } from '../../ZoneCard'

type BedZoneProps = {
  zone: ZoneMeta
  agents: Agent[]
  selectedAgentId?: string | null
  onSelectAgent: (id: string) => void
}

export function BedZone({ zone, agents, selectedAgentId, onSelectAgent }: BedZoneProps) {
  return (
    <ZoneCard
      zone={zone}
      agents={agents}
      selectedAgentId={selectedAgentId}
      onSelectAgent={onSelectAgent}
    />
  )
}
