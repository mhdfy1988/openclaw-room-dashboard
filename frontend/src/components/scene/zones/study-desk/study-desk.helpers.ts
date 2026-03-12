import type { Agent, StudyDeskVisualState } from '../../../../types/room'

export function getStudyDeskCharacterClassName(visualState: StudyDeskVisualState) {
  return `studydesk-character-anchor ${visualState.occupied ? 'is-occupied' : 'is-empty'} ${visualState.selected ? 'is-selected' : ''} status-${visualState.status}`
}

export function shouldRenderStudyDeskCharacter(visualState: StudyDeskVisualState) {
  return visualState.occupied
}

export function isStudyDeskCharacterSelected(visualState: StudyDeskVisualState) {
  return visualState.selected
}

export function shouldShowStudyDeskSelectionRing(visualState: StudyDeskVisualState) {
  return shouldRenderStudyDeskCharacter(visualState) && isStudyDeskCharacterSelected(visualState)
}

export function shouldShowStudyDeskThoughtCue(visualState: StudyDeskVisualState) {
  return shouldRenderStudyDeskCharacter(visualState) && visualState.thoughtCue
}

export function getStudyDeskThoughtCueText(visualState: StudyDeskVisualState) {
  return shouldShowStudyDeskThoughtCue(visualState) ? '…' : ''
}

export function getStudyDeskVisualState(
  agents: Agent[],
  selectedAgentId?: string | null,
): StudyDeskVisualState {
  const primary = agents[0]

  if (!primary) {
    return {
      occupied: false,
      selected: false,
      status: 'offline',
      thoughtCue: false,
    }
  }

  const activeStatus = primary.status === 'offline' ? 'idle' : primary.status

  return {
    occupied: primary.status !== 'offline',
    selected: primary.id === selectedAgentId,
    status: activeStatus,
    thoughtCue: primary.status === 'thinking',
  }
}
