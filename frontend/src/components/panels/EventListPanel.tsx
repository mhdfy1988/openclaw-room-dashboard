import './panels.css'
import { formatTime } from '../../lib/format'
import type { RoomEvent } from '../../types/room'

type EventListPanelProps = {
  events: RoomEvent[]
}

export function EventListPanel({ events }: EventListPanelProps) {
  return (
    <div className="panel-card">
      <div className="panel-title-row">
        <h2>最近事件</h2>
        <span className="event-count">{events.length} 条</span>
      </div>
      {events.length === 0 ? (
        <p className="empty-panel-message">暂无事件。完成 OpenClaw 接入后，这里会显示实时更新。</p>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id}>
              <div className="event-topline">
                <strong>{event.agentId}</strong>
                <time>{formatTime(event.at)}</time>
              </div>
              <span>{event.text}</span>
              <em>{event.type}</em>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
