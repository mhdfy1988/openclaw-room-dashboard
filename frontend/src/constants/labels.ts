import type { AgentStatus } from '../types/room'

export const statusLabel: Record<AgentStatus, string> = {
  sleeping: '睡觉',
  idle: '待机',
  working: '工作中',
  thinking: '思考中',
  offline: '离线',
}
