import type { Agent, ZoneMeta } from '../../../../types/room'
import { ZoneCard } from '../../ZoneCard'
import { StudyDeskZoneAsset } from './StudyDeskZoneAsset'

type StudyDeskZoneProps = {
  zone: ZoneMeta
  agents: Agent[]
  selectedAgentId?: string | null
  onSelectAgent: (id: string) => void
}

export function StudyDeskZone({ zone, agents, selectedAgentId, onSelectAgent }: StudyDeskZoneProps) {
  return (
    <ZoneCard
      zone={zone}
      agents={agents}
      selectedAgentId={selectedAgentId}
      onSelectAgent={onSelectAgent}
      asset={<StudyDeskZoneAsset agents={agents} selectedAgentId={selectedAgentId} />}
    />
  )
}
