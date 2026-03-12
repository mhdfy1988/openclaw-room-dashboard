import './scene.css'
import { AgentAvatarCard } from '../agent/AgentAvatarCard'
import { getAvatarDensity } from '../../lib/avatar-density'
import type { Agent, RoomState, ZoneMeta } from '../../types/room'
import { CenterConsoleAsset } from './assets/CenterConsoleAsset'
import { WorkStudioAsset } from './assets/WorkStudioAsset'
import { StudyRoomAsset } from './assets/StudyRoomAsset'
import { SofaAsset } from './assets/SofaAsset'
import { BedAsset } from './assets/BedAsset'

type RoomSceneProps = {
  data: RoomState | null
  zones: ZoneMeta[]
  zoneMap: Map<string, Agent[]>
  selectedAgent: Agent | null
  onSelectAgent: (id: string) => void
}

function renderRoomAgents(
  zone: ZoneMeta,
  agents: Agent[],
  selectedAgentId: string | null | undefined,
  onSelectAgent: (id: string) => void,
) {
  if (agents.length === 0) {
    return null
  }

  const density = getAvatarDensity(zone.key, agents.length)

  return agents.map((agent) => (
    <AgentAvatarCard
      key={agent.id}
      agent={agent}
      selected={agent.id === selectedAgentId}
      compact={zone.key === 'study-desk'}
      density={density}
      onSelect={onSelectAgent}
    />
  ))
}

export function RoomScene({ data, zones, zoneMap, selectedAgent, onSelectAgent }: RoomSceneProps) {
  const selectedAgentId = selectedAgent?.id
  const zoneByKey = new Map(zones.map((zone) => [zone.key, zone]))
  const centerConsole = zoneByKey.get('center-console')!
  const workDesk = zoneByKey.get('work-desk')!
  const studyDesk = zoneByKey.get('study-desk')!
  const sofa = zoneByKey.get('sofa')!
  const bed = zoneByKey.get('bed')!

  return (
    <div className={`room-scene ${data?.roomMode === 'night' ? 'night' : 'day'}`} data-scene-style="pixel-ready">
      <div className="scene-asset-layer pixel-art-surface" aria-hidden="true">
        <div className="scene-backdrop">
          <div className="house-shell" />
          <div className="house-roof-shadow" />
          <div className="room-block room-block-console" />
          <div className="room-block room-block-work" />
          <div className="room-block room-block-study" />
          <div className="room-block room-block-sofa" />
          <div className="room-block room-block-bed" />
          <div className="scene-prop scene-prop-work-desk">
            <WorkStudioAsset />
          </div>
          <div className="scene-prop scene-prop-study-desk">
            <StudyRoomAsset />
          </div>
          <div className="scene-prop scene-prop-sofa">
            <SofaAsset />
          </div>
          <div className="scene-prop scene-prop-bed">
            <BedAsset />
          </div>
          <div className="scene-prop scene-prop-center-console">
            <CenterConsoleAsset />
          </div>
          <div className="thick-wall thick-wall-left-top" />
          <div className="thick-wall thick-wall-left-bottom" />
          <div className="thick-wall thick-wall-right-top" />
          <div className="thick-wall thick-wall-right-bottom" />
          <div className="thick-wall thick-wall-bottom-left" />
          <div className="thick-wall thick-wall-bottom-right" />
          <div className="door-hole door-hole-bottom" />
          <div className="floor-tiles floor-tiles-top" />
          <div className="floor-tiles floor-tiles-bottom" />
          <div className="horizontal-wall horizontal-wall-left" />
          <div className="horizontal-wall horizontal-wall-right" />
          <div className="wall-trim wall-trim-top" />
          <div className="wall-trim wall-trim-bottom" />
        </div>
      </div>

      <section className="room-space room-space-console">
        <div className="room-space-content room-space-content-console">
          {renderRoomAgents(centerConsole, zoneMap.get('center-console') ?? [], selectedAgentId, onSelectAgent)}
        </div>
      </section>

      <section className="room-space room-space-work">
        <div className="room-space-content room-space-content-work">
          {renderRoomAgents(workDesk, zoneMap.get('work-desk') ?? [], selectedAgentId, onSelectAgent)}
        </div>
      </section>

      <section className="room-space room-space-study">
        <div className="room-space-content room-space-content-study">
          {renderRoomAgents(studyDesk, zoneMap.get('study-desk') ?? [], selectedAgentId, onSelectAgent)}
        </div>
      </section>

      <section className="room-space room-space-sofa">
        <div className="room-space-content room-space-content-sofa">
          {renderRoomAgents(sofa, zoneMap.get('sofa') ?? [], selectedAgentId, onSelectAgent)}
        </div>
      </section>

      <section className="room-space room-space-bed">
        <div className="room-space-content room-space-content-bed">
          {renderRoomAgents(bed, zoneMap.get('bed') ?? [], selectedAgentId, onSelectAgent)}
        </div>
      </section>
    </div>
  )
}
