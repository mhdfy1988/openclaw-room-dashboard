import { createRoomStateEnvelope } from './room-state-builders.js'

export function createEmptyRoomState(now = Date.now()) {
  return createRoomStateEnvelope({
    now,
    alerts: [
      {
        id: 'gateway-unconfigured',
        severity: 'warning',
        title: '尚未连接 OpenClaw',
        detail: '当前没有真实网关数据，完成接入配置后房间状态才会恢复实时更新。',
      },
    ],
  })
}
