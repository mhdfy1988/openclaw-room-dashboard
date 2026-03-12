import './panels.css'
import type { RoomState, RoomSummary } from '../../types/room'

type RoomSummaryPanelProps = {
  data: RoomState | null
  roomSummary: RoomSummary
}

export function RoomSummaryPanel({ data, roomSummary }: RoomSummaryPanelProps) {
  if (!data) {
    return <p>暂无房间数据。</p>
  }

  if (roomSummary.totalAgents === 0) {
    return (
      <>
        <p className="detail-title">OpenClaw 尚未连接</p>
        <div className="detail-block">
          <span>当前状态</span>
          <strong>目前还没有展示任何智能体。</strong>
        </div>
        <div className="detail-block muted">
          <span>下一步</span>
          <strong>点击右上角“接入配置”，填入地址和密钥后即可连接。</strong>
        </div>
      </>
    )
  }

  return (
    <>
      <p className="detail-title">房间摘要</p>
      <div className="detail-grid">
        <p><span>智能体总数</span><strong>{roomSummary.totalAgents}</strong></p>
        <p><span>在线数量</span><strong>{roomSummary.onlineAgents}</strong></p>
        <p><span>活跃中</span><strong>{roomSummary.activeAgents}</strong></p>
        <p><span>休眠中</span><strong>{roomSummary.sleepingAgents}</strong></p>
      </div>
      <div className="detail-block">
        <span>房间活跃度</span>
        <strong>{data.roomMode === 'night' ? '休息' : '忙碌'}</strong>
      </div>
      <div className="detail-block muted">
        <span>已占用区域</span>
        <strong>
          {roomSummary.occupiedZones.length > 0
            ? roomSummary.occupiedZones.map((zone) => `${zone.icon} ${zone.title}`).join(' · ')
            : '暂无'}
        </strong>
      </div>
      <div className="detail-block muted">
        <span>说明</span>
        <strong>点击房间里的角色圆卡后，这里会切换为对应详情。</strong>
      </div>
    </>
  )
}
