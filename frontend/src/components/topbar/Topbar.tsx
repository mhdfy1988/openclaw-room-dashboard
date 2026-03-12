import './topbar.css'
import { formatFractionMetric, formatOptionalMetric } from '../../lib/format'
import { getStreamStateLabel } from '../../lib/room-alerts'
import type { DashboardOverview } from '../../lib/dashboard-selectors'
import type { GatewayOverview, RoomAlert, RoomStreamState } from '../../types/room'

type TopbarProps = {
  overview: DashboardOverview
  alerts: RoomAlert[]
  environmentLabel: string
  streamState: RoomStreamState
  onOpenSettings: () => void
}

function getEnvironmentLabel(label: string) {
  return label === 'DEV' ? '开发' : '生产'
}

function getGatewayLabel(status: GatewayOverview['status'] | undefined) {
  if (status === 'connected') {
    return '网关已连接'
  }

  if (status === 'degraded') {
    return '网关部分可用'
  }

  return '网关未连接'
}

function getGatewayBadgeClass(status: GatewayOverview['status'] | undefined) {
  if (status === 'connected') {
    return 'is-online'
  }

  if (status === 'degraded') {
    return 'is-degraded'
  }

  return 'is-offline'
}

function getRoomModeLabel(roomMode: DashboardOverview['roomMode']) {
  return roomMode === 'night' ? '休息' : '忙碌'
}

function getTopbarAlertSummary(alertCount: number) {
  if (alertCount <= 1) {
    return '完整详情请查看预警中心。'
  }

  return `另有 ${alertCount - 1} 条预警，完整详情请查看预警中心。`
}

function getGatewayDataHint(overview: DashboardOverview) {
  if (overview.gateway?.status !== 'degraded') {
    return null
  }

  return '当前只能拿到部分远程网关数据，渠道、连接和部分实时统计会显示为 --。'
}

export function Topbar({
  overview,
  alerts,
  environmentLabel,
  streamState,
  onOpenSettings,
}: TopbarProps) {
  const gateway = overview.gateway
  const primaryAlert = overview.primaryAlert
  const gatewayHint = getGatewayDataHint(overview)

  return (
    <header className="topbar">
      <div className="topbar-hero">
        <div className="topbar-copy">
          <span className="topbar-kicker">OpenClaw Control Room</span>
          <h1>房间看板</h1>
          <p>OpenClaw 多智能体房间态势面板</p>
        </div>

        <div className="topbar-hero-grid">
          <article className="topbar-hero-stat">
            <span>智能体总数</span>
            <strong>{overview.metrics.totalAgents}</strong>
          </article>
          <article className="topbar-hero-stat">
            <span>在线角色</span>
            <strong>{overview.metrics.onlineAgents}</strong>
          </article>
          <article className="topbar-hero-stat">
            <span>活跃角色</span>
            <strong>{overview.metrics.activeAgents}</strong>
          </article>
          <article className="topbar-hero-stat">
            <span>休眠角色</span>
            <strong>{overview.metrics.sleepingAgents}</strong>
          </article>
        </div>

        <div className="topbar-hero-summary">
          <span>运行摘要</span>
          <strong>{overview.summaryTitle}</strong>
          <p>{overview.summaryDetail}</p>
          {gatewayHint ? <p className="topbar-hero-warning">{gatewayHint}</p> : null}
          <div className="topbar-hero-meta">
            <span className="topbar-hero-chip">最近事件 {overview.latestEventTime}</span>
            <span className="topbar-hero-chip">
              {alerts.length > 0 ? `${alerts.length} 条预警待处理` : '当前无预警'}
            </span>
          </div>
        </div>
      </div>

      <div className="topbar-meta">
        <div className="topbar-badges">
          <span className={`env-badge env-${environmentLabel.toLowerCase()}`}>
            {getEnvironmentLabel(environmentLabel)}
          </span>
          <span className={`gateway-badge ${getGatewayBadgeClass(gateway?.status)}`}>
            {getGatewayLabel(gateway?.status)}
          </span>
          {gateway?.channels?.map((channel) => (
            <span
              key={channel.id}
              className={`channel-chip ${channel.healthy ? 'is-healthy' : 'is-warning'}`}
            >
              {channel.label} {channel.healthy ? '正常' : '异常'}
            </span>
          ))}
          {primaryAlert ? (
            <span className={`alert-badge alert-badge-${primaryAlert.severity}`}>
              {alerts.length} 条告警
            </span>
          ) : null}
        </div>

        <div className="gateway-metrics">
          <p>
            <span>同步状态</span>
            <strong>{getStreamStateLabel(streamState)}</strong>
          </p>
          <p>
            <span>房间活跃度</span>
            <strong>{getRoomModeLabel(overview.roomMode)}</strong>
          </p>
          <p>
            <span>活跃会话</span>
            <strong>{formatOptionalMetric(gateway?.activeSessionCount)}</strong>
          </p>
          <p>
            <span>渠道健康</span>
            <strong>
              {formatFractionMetric(gateway?.healthyChannelCount, gateway?.configuredChannelCount)}
            </strong>
          </p>
          <p>
            <span>连接来源</span>
            <strong>{formatOptionalMetric(gateway?.connectionCount)}</strong>
          </p>
          <p>
            <span>最近同步</span>
            <strong>{overview.latestSyncTime}</strong>
          </p>
        </div>

        {primaryAlert ? (
          <div className={`topbar-alert-card severity-${primaryAlert.severity}`}>
            <strong>{primaryAlert.title}</strong>
            <span>{getTopbarAlertSummary(alerts.length)}</span>
          </div>
        ) : null}

        <button type="button" className="topbar-action" onClick={onOpenSettings}>
          接入配置
        </button>
      </div>
    </header>
  )
}
