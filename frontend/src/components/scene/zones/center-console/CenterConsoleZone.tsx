import type { Agent, ZoneMeta } from '../../../../types/room'
import { ZoneCard } from '../../ZoneCard'
import { CenterConsoleZoneAsset } from './CenterConsoleZoneAsset'

type CenterConsoleZoneProps = {
  zone: ZoneMeta
  agents: Agent[]
  selectedAgentId?: string | null
  onSelectAgent: (id: string) => void
}

export function CenterConsoleZone({ zone, agents, selectedAgentId, onSelectAgent }: CenterConsoleZoneProps) {
  return (
    <ZoneCard
      zone={zone}
      agents={agents}
      selectedAgentId={selectedAgentId}
      onSelectAgent={onSelectAgent}
      asset={<CenterConsoleZoneAsset />}
    />
  )
}
