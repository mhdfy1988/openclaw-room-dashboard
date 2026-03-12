import './study-desk-character.css'
import type { StudyDeskVisualState } from '../../../../types/room'
import { getStudyDeskCharacterClassName, getStudyDeskThoughtCueText, shouldRenderStudyDeskCharacter, shouldShowStudyDeskSelectionRing, shouldShowStudyDeskThoughtCue } from './study-desk.helpers'

type StudyDeskCharacterProps = {
  visualState: StudyDeskVisualState
}

export function StudyDeskCharacter({ visualState }: StudyDeskCharacterProps) {
  return (
    <div className={getStudyDeskCharacterClassName(visualState)}>
      {shouldRenderStudyDeskCharacter(visualState) ? (
        <>
          <span className="studydesk-selection-ring" hidden={!shouldShowStudyDeskSelectionRing(visualState)} />
          <span className="studydesk-character-thought" hidden={!shouldShowStudyDeskThoughtCue(visualState)}>{getStudyDeskThoughtCueText(visualState)}</span>
          <span className="studydesk-character-seatback" />
          <span className="studydesk-character-body" />
          <span className="studydesk-character-arm" />
          <span className="studydesk-character-head" />
        </>
      ) : null}
    </div>
  )
}
