import type { Agent, ZoneMeta } from '../../../../types/room'
import { ZoneCard } from '../../ZoneCard'
import { WorkDeskZoneAsset } from './WorkDeskZoneAsset'

type WorkDeskZoneProps = {
  zone: ZoneMeta
  agents: Agent[]
  selectedAgentId?: string | null
  onSelectAgent: (id: string) => void
}

export function WorkDeskZone({ zone, agents, selectedAgentId, onSelectAgent }: WorkDeskZoneProps) {
  return (
    <ZoneCard
      zone={zone}
      agents={agents}
      selectedAgentId={selectedAgentId}
      onSelectAgent={onSelectAgent}
      asset={<WorkDeskZoneAsset />}
    />
  )
}
