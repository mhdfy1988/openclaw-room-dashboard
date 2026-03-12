import '../../assets/study-desk.css'
import type { Agent } from '../../../../types/room'
import { StudyDeskCharacter } from './StudyDeskCharacter'
import { getStudyDeskVisualState } from './study-desk.helpers'

type StudyDeskZoneAssetProps = {
  agents: Agent[]
  selectedAgentId?: string | null
}

export function StudyDeskZoneAsset({ agents, selectedAgentId }: StudyDeskZoneAssetProps) {
  const studyDeskVisualState = getStudyDeskVisualState(agents, selectedAgentId)

  return (
    <div className="zone-asset-layer pixel-art-surface" aria-hidden="true">
      <div className="studydesk-shell">
        <StudyDeskCharacter visualState={studyDeskVisualState} />
        <div className="studydesk-lamp">
          <span className="studydesk-light" />
        </div>
        <div className="studydesk-board">
          <span className="studydesk-line studydesk-line-primary" />
          <span className="studydesk-line studydesk-line-secondary" />
          <span className="studydesk-line studydesk-line-note" />
        </div>
        <div className="studydesk-book-stack">
          <span className="studydesk-book studydesk-book-a" />
          <span className="studydesk-book studydesk-book-b" />
          <span className="studydesk-book studydesk-book-c" />
        </div>
        <div className="studydesk-pages">
          <span className="studydesk-page studydesk-page-left" />
          <span className="studydesk-page studydesk-page-right" />
        </div>
        <div className="studydesk-magnifier" />
        <div className="studydesk-base" />
      </div>
    </div>
  )
}
