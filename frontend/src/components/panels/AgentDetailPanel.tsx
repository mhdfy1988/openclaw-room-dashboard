import './panels.css'
import { getAgentDisplayIcon } from '../../constants/agent-icons'
import { statusLabel } from '../../constants/labels'
import { zones } from '../../constants/zones'
import { formatNumber, formatTime } from '../../lib/format'
import type { Agent } from '../../types/room'

type AgentDetailPanelProps = {
  agent: Agent
  onClearSelection: () => void
  showClearSelection: boolean
}

const roleLabel: Record<Agent['role'], string> = {
  controller: '主控',
  work: '执行',
  study: '研究',
}

const zoneLabel = Object.fromEntries(zones.map((zone) => [zone.key, zone.title])) as Record<string, string>

export function AgentDetailPanel({
  agent,
  onClearSelection,
  showClearSelection,
}: AgentDetailPanelProps) {
  const agentIcon = getAgentDisplayIcon(agent)
  const runtime = agent.runtime

  return (
    <>
      <div className="panel-title-row detail-title-row">
        <h2>角色详情</h2>
        {showClearSelection ? (
          <button className="clear-selection-button" onClick={onClearSelection}>
            返回房间概览
          </button>
        ) : null}
      </div>

      <p className="detail-title">
        {agentIcon} {agent.name}
      </p>

      <div className="detail-grid">
        <p><span>角色类型</span><strong>{roleLabel[agent.role]}</strong></p>
        <p><span>当前状态</span><strong>{statusLabel[agent.status]}</strong></p>
        <p><span>所在区域</span><strong>{zoneLabel[agent.roomZone] || agent.roomZone}</strong></p>
        <p><span>主题标识</span><strong>{agent.theme}</strong></p>
      </div>

      <div className="detail-block">
        <span>当前活动</span>
        <strong>{agent.activityLabel}</strong>
      </div>

      <div className="detail-block">
        <span>当前任务</span>
        <strong>{agent.currentTask ?? '暂无'}</strong>
      </div>

      <div className="detail-grid detail-grid-extended">
        <p><span>会话通道</span><strong>{runtime?.channel || '--'}</strong></p>
        <p><span>会话类型</span><strong>{runtime?.sessionKind || '--'}</strong></p>
        <p><span>当前模型</span><strong>{runtime?.model || '--'}</strong></p>
        <p><span>显示名称</span><strong>{runtime?.displayName || '--'}</strong></p>
        <p><span>会话键</span><strong>{runtime?.sessionKey || '--'}</strong></p>
        <p><span>会话 ID</span><strong>{runtime?.sessionId || '--'}</strong></p>
        <p><span>上下文上限</span><strong>{formatNumber(runtime?.contextTokens)}</strong></p>
        <p><span>已用令牌</span><strong>{formatNumber(runtime?.totalTokens)}</strong></p>
        <p><span>输入令牌</span><strong>{formatNumber(runtime?.inputTokens)}</strong></p>
        <p><span>输出令牌</span><strong>{formatNumber(runtime?.outputTokens)}</strong></p>
        <p><span>剩余令牌</span><strong>{formatNumber(runtime?.remainingTokens)}</strong></p>
        <p><span>上下文占比</span><strong>{runtime?.percentUsed != null ? `${runtime.percentUsed}%` : '--'}</strong></p>
      </div>

      <div className={`detail-block ${runtime?.tokenMetricsFresh === false ? 'warning' : 'muted'}`}>
        <span>统计状态</span>
        <strong>
          {runtime?.tokenMetricsFresh === false
            ? '令牌统计未刷新，可能存在上游模型异常或统计延迟'
            : '令牌统计正常'}
        </strong>
      </div>

      <div className="detail-block muted">
        <span>最近目标</span>
        <strong>{runtime?.lastTarget || '--'}</strong>
      </div>

      <div className="detail-block muted">
        <span>账号 ID</span>
        <strong>{runtime?.accountId || '--'}</strong>
      </div>

      <div className="detail-block muted">
        <span>运行备注</span>
        <strong>{runtime?.abortedLastRun ? '上一轮执行曾被中断' : '上一轮执行正常结束'}</strong>
      </div>

      <div className="detail-block muted">
        <span>可调度对象</span>
        <strong>{agent.canDispatchTo?.join('、') || '无'}</strong>
      </div>

      <div className="detail-block muted">
        <span>最近活跃</span>
        <strong>{formatTime(agent.lastSeenAt)}</strong>
      </div>
    </>
  )
}
