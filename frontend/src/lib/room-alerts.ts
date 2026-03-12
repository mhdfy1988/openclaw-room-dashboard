import type { RoomAlert, RoomAlertSeverity, RoomStreamState } from '../types/room'

const severityPriority: Record<RoomAlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export function getAlertSeverityLabel(severity: RoomAlertSeverity) {
  if (severity === 'critical') {
    return '严重'
  }

  if (severity === 'warning') {
    return '预警'
  }

  return '提示'
}

export function getStreamStateLabel(streamState: RoomStreamState) {
  if (streamState === 'live') {
    return '实时连接正常'
  }

  if (streamState === 'stream-error') {
    return '实时连接异常'
  }

  if (streamState === 'refresh-error') {
    return '状态刷新失败'
  }

  if (streamState === 'initial-error') {
    return '初始状态获取失败'
  }

  return '连接中...'
}

export function mergeRoomAlerts(alerts: RoomAlert[], streamState: RoomStreamState) {
  const next = [...alerts]

  if (streamState === 'initial-error') {
    next.push({
      id: 'stream-initial-error',
      severity: 'critical',
      title: '看板初始状态获取失败',
      detail: '页面尚未拿到房间状态，请检查本地后端服务是否正在运行。',
    })
  } else if (streamState === 'refresh-error') {
    next.push({
      id: 'stream-refresh-error',
      severity: 'warning',
      title: '房间状态刷新失败',
      detail: '看板保留了上一次成功状态，但最新房间数据尚未刷新。',
    })
  } else if (streamState === 'stream-error') {
    next.push({
      id: 'stream-error',
      severity: 'warning',
      title: '实时同步连接异常',
      detail: 'SSE 连接已中断，页面可能不会自动刷新最新状态。',
    })
  }

  return next.sort(
    (left, right) =>
      severityPriority[left.severity] - severityPriority[right.severity] ||
      left.title.localeCompare(right.title, 'zh-CN'),
  )
}
