import './panels.css'
import { getAlertSeverityLabel } from '../../lib/room-alerts'
import type { ManagedRoomAlert } from '../../hooks/useManagedAlerts'

type AlertListPanelProps = {
  alerts: ManagedRoomAlert[]
  mutedAlertCount: number
  onAcknowledgeAlert: (id: string) => void
  onMuteAlert: (id: string) => void
  onRestoreMutedAlerts: () => void
}

export function AlertListPanel({
  alerts,
  mutedAlertCount,
  onAcknowledgeAlert,
  onMuteAlert,
  onRestoreMutedAlerts,
}: AlertListPanelProps) {
  return (
    <div className="panel-card">
      <div className="panel-title-row">
        <h2>预警中心</h2>
        <span className="event-count">{alerts.length} 条</span>
      </div>

      {alerts.length === 0 ? (
        <p className="empty-panel-message">当前没有需要处理的预警，房间状态看起来稳定。</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((alert) => (
            <li key={alert.id} className={`alert-item severity-${alert.severity}`}>
              <div className="alert-topline">
                <strong>{alert.title}</strong>
                <div className="alert-topline-actions">
                  {alert.acknowledged ? <span className="alert-acknowledged-badge">已确认</span> : null}
                  <span className={`alert-severity alert-severity-${alert.severity}`}>
                    {getAlertSeverityLabel(alert.severity)}
                  </span>
                </div>
              </div>
              <p>{alert.detail}</p>
              <div className="alert-actions">
                <button
                  type="button"
                  className="alert-action-button"
                  onClick={() => onAcknowledgeAlert(alert.id)}
                  disabled={alert.acknowledged}
                >
                  {alert.acknowledged ? '已确认' : '确认'}
                </button>
                <button
                  type="button"
                  className="alert-action-button"
                  onClick={() => onMuteAlert(alert.id)}
                >
                  静音直到恢复
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {mutedAlertCount > 0 ? (
        <div className="alert-muted-summary">
          <span>{mutedAlertCount} 条预警已被静音，恢复后会重新出现。</span>
          <button type="button" onClick={onRestoreMutedAlerts}>
            恢复显示
          </button>
        </div>
      ) : null}
    </div>
  )
}
