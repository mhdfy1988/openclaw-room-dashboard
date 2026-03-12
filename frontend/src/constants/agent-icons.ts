import type { Agent, AgentRole } from '../types/room'

const defaultRoleIcons: Record<AgentRole, string> = {
  controller: '\u{1F3AE}',
  work: '\u{1F4BC}',
  study: '\u{1F4DA}',
}

export function getAgentIcon(emoji: string | null | undefined, role: AgentRole) {
  return emoji?.trim() || defaultRoleIcons[role] || '\u{1F916}'
}

export function getAgentDisplayIcon(agent: Pick<Agent, 'emoji' | 'fallbackIcon' | 'role'>) {
  return agent.emoji?.trim() || agent.fallbackIcon?.trim() || getAgentIcon(agent.emoji, agent.role)
}
