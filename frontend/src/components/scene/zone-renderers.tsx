import type { Agent, ZoneMeta } from '../../types/room'
import { BedZone } from './zones/bed/BedZone'
import { CenterConsoleZone } from './zones/center-console/CenterConsoleZone'
import { SofaZone } from './zones/sofa/SofaZone'
import { StudyDeskZone } from './zones/study-desk/StudyDeskZone'
import { WorkDeskZone } from './zones/work-desk/WorkDeskZone'
import { ZoneCard } from './ZoneCard'

// All current room zones are explicitly mapped below; fallback stays only as a safety net.

type ZoneRendererProps = {
  zone: ZoneMeta
  agents: Agent[]
  selectedAgentId?: string | null
  onSelectAgent: (id: string) => void
}

export function renderZone(props: ZoneRendererProps) {
  const { zone } = props

  if (zone.key === 'center-console') {
    return <CenterConsoleZone key={zone.key} {...props} />
  }

  if (zone.key === 'work-desk') {
    return <WorkDeskZone key={zone.key} {...props} />
  }

  if (zone.key === 'study-desk') {
    return <StudyDeskZone key={zone.key} {...props} />
  }

  if (zone.key === 'sofa') {
    return <SofaZone key={zone.key} {...props} />
  }

  if (zone.key === 'bed') {
    return <BedZone key={zone.key} {...props} />
  }

  return <ZoneCard key={zone.key} {...props} />
}
