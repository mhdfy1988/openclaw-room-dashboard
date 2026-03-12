import './study-desk.css'
import { getStudyDeskVisualState } from '../../../lib/study-desk'
import type { Agent } from '../../../types/room'

type StudyDeskAssetProps = {
  agents: Agent[]
  selectedAgentId?: string | null
  showCharacter?: boolean
}

export function StudyDeskAsset({ agents, selectedAgentId, showCharacter = true }: StudyDeskAssetProps) {
  const studyDeskVisualState = getStudyDeskVisualState(agents, selectedAgentId)

  return (
    <div className="zone-asset-layer pixel-art-surface" aria-hidden="true">
      <div className="studydesk-shell">
        {showCharacter ? (
          <div
            className={`studydesk-character-anchor ${
              studyDeskVisualState.occupied ? 'is-occupied' : 'is-empty'
            } ${studyDeskVisualState.selected ? 'is-selected' : ''} status-${studyDeskVisualState.status}`}
          >
            {studyDeskVisualState.occupied ? (
              <>
                <span className="studydesk-selection-ring" />
                <span
                  className="studydesk-character-thought"
                  hidden={!studyDeskVisualState.thoughtCue}
                >
                  ...
                </span>
                <span className="studydesk-character-seatback" />
                <span className="studydesk-character-body" />
                <span className="studydesk-character-arm" />
                <span className="studydesk-character-head" />
              </>
            ) : null}
          </div>
        ) : null}

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
