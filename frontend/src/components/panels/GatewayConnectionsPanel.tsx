import './panels.css'
import { formatTime } from '../../lib/format'
import type { GatewayConnection, GatewayOverview } from '../../types/room'

type GatewayConnectionsPanelProps = {
  connections: GatewayConnection[]
  gateway: GatewayOverview | null
}

export function GatewayConnectionsPanel({
  connections,
  gateway,
}: GatewayConnectionsPanelProps) {
  const presenceUnavailable = gateway?.status === 'degraded' && gateway.connectionCount == null

  return (
    <div className="panel-card">
      <div className="panel-title-row">
        <h2>当前连接</h2>
        <span className="event-count">{presenceUnavailable ? '--' : `${connections.length} 个`}</span>
      </div>

      {presenceUnavailable ? (
        <p className="empty-panel-message">
          远程 Gateway 当前未返回连接来源数据，请先恢复 status / health / system-presence。
        </p>
      ) : connections.length === 0 ? (
        <p className="empty-panel-message">暂未检测到连接实例。</p>
      ) : (
        <ul className="connection-list">
          {connections.map((connection) => (
            <li key={connection.id}>
              <div className="connection-topline">
                <strong>{connection.host}</strong>
                <span className="connection-mode">{connection.mode}</span>
              </div>
              <p>{connection.summary || '--'}</p>
              <div className="connection-meta">
                <span>{connection.ip || '--'}</span>
                <span>{connection.version || '--'}</span>
                <span>{formatTime(connection.lastSeenAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
