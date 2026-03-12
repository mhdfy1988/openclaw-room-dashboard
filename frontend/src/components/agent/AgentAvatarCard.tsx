import './agent-avatar-card.css'
import type { CSSProperties } from 'react'
import { getAgentDisplayIcon } from '../../constants/agent-icons'
import { statusLabel } from '../../constants/labels'
import { getAgentAvatarTheme } from '../../lib/agent-avatar-theme'
import type { Agent } from '../../types/room'

export type AgentAvatarDensity = 'normal' | 'crowded' | 'dense' | 'packed'

type AgentAvatarCardProps = {
  agent: Agent
  selected: boolean
  compact?: boolean
  density?: AgentAvatarDensity
  onSelect: (id: string) => void
}

type AgentAvatarSizeStyle = CSSProperties & {
  '--avatar-size': string
  '--avatar-ring-size': string
  '--avatar-emoji-size': string
  '--avatar-status-size': string
  '--avatar-status-offset': string
}

function getAvatarSizeStyle(compact: boolean, density: AgentAvatarDensity): AgentAvatarSizeStyle {
  const base = compact
    ? { card: 64, ring: 46, emoji: 24, status: 10, offset: 4 }
    : { card: 76, ring: 56, emoji: 30, status: 12, offset: 5 }

  const scaleByDensity: Record<AgentAvatarDensity, number> = {
    normal: 1,
    crowded: 0.9,
    dense: 0.82,
    packed: 0.74,
  }

  const scale = scaleByDensity[density]
  return {
    '--avatar-size': `${Math.round(base.card * scale)}px`,
    '--avatar-ring-size': `${Math.round(base.ring * scale)}px`,
    '--avatar-emoji-size': `${Math.round(base.emoji * scale)}px`,
    '--avatar-status-size': `${Math.max(8, Math.round(base.status * scale))}px`,
    '--avatar-status-offset': `${Math.max(3, Math.round(base.offset * scale))}px`,
  }
}

export function AgentAvatarCard({
  agent,
  selected,
  compact = false,
  density = 'normal',
  onSelect,
}: AgentAvatarCardProps) {
  const agentIcon = getAgentDisplayIcon(agent)
  const agentAvatarTheme = getAgentAvatarTheme(agent)
  const agentAvatarSize = getAvatarSizeStyle(compact, density)

  return (
    <button
      className={`agent-avatar-card status-${agent.status} ${selected ? 'selected' : ''} ${compact ? 'agent-avatar-card-compact' : ''}`}
      onClick={() => onSelect(agent.id)}
      title={`${agent.name} | ${statusLabel[agent.status]}`}
      aria-label={`${agent.name}, ${statusLabel[agent.status]}`}
      style={{ ...agentAvatarTheme, ...agentAvatarSize }}
    >
      <span className="agent-avatar-ring">
        <span className="agent-emoji">{agentIcon}</span>
      </span>
      <span className="agent-name">{agent.name}</span>
      <span className="agent-mini-status">{statusLabel[agent.status]}</span>
    </button>
  )
}
