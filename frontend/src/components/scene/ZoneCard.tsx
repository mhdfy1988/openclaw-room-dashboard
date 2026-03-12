import './zone-card.css'
import type { ReactNode } from 'react'
import { AgentAvatarCard } from '../agent/AgentAvatarCard'
import { getAvatarDensity } from '../../lib/avatar-density'
import type { Agent, ZoneMeta } from '../../types/room'

type ZoneCardProps = {
  zone: ZoneMeta
  agents: Agent[]
  selectedAgentId?: string | null
  onSelectAgent: (id: string) => void
  asset?: ReactNode
}

export function ZoneCard({ zone, agents, selectedAgentId, onSelectAgent, asset }: ZoneCardProps) {
  const density = getAvatarDensity(zone.key, agents.length)

  return (
    <section className={`zone zone-${zone.key}`}>
      {asset}

      <div className={`zone-header ${zone.key === 'study-desk' ? 'zone-header-study' : ''}`}>
        <span className="zone-icon">{zone.icon}</span>
        <div>
          <strong>{zone.title}</strong>
          <p>{zone.subtitle}</p>
        </div>
        {zone.accentLabel ? <span className="zone-accent-badge">{zone.accentLabel}</span> : null}
      </div>

      <div className="zone-body">
        {agents.length > 0 ? (
          agents.map((agent) => (
            <AgentAvatarCard
              key={agent.id}
              agent={agent}
              selected={agent.id === selectedAgentId}
              compact={zone.key === 'study-desk'}
              density={density}
              onSelect={onSelectAgent}
            />
          ))
        ) : (
          <div className="zone-placeholder">当前无人</div>
        )}
      </div>
    </section>
  )
}
