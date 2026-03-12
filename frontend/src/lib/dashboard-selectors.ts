import { formatTime } from './format'
import type { Agent, RoomAlert, RoomEvent, RoomState } from '../types/room'

type DashboardAlert = RoomAlert & {
  acknowledged?: boolean
}

export type DashboardAgentMetrics = {
  totalAgents: number
  onlineAgents: number
  activeAgents: number
  sleepingAgents: number
}

export type DashboardOverview = {
  gateway: RoomState['gateway'] | null
  roomMode: RoomState['roomMode']
  primaryAlert: RoomAlert | null
  latestEvent: RoomEvent | null
  latestEventTime: string
  latestSyncTime: string
  defaultAgent: Agent | null
  metrics: DashboardAgentMetrics
  summaryTitle: string
  summaryDetail: string
}

export function getDashboardAgentMetrics(agents: Agent[]): DashboardAgentMetrics {
  const onlineAgents = agents.filter((agent) => agent.status !== 'offline')
  const activeAgents = agents.filter(
    (agent) => agent.status === 'working' || agent.status === 'thinking',
  )
  const sleepingAgents = agents.filter((agent) => agent.status === 'sleeping')

  return {
    totalAgents: agents.length,
    onlineAgents: onlineAgents.length,
    activeAgents: activeAgents.length,
    sleepingAgents: sleepingAgents.length,
  }
}

export function selectDefaultAgent(agents: Agent[]) {
  return agents.find((agent) => agent.isDefault) || agents[0] || null
}

export function selectLatestEvent(events: RoomEvent[]) {
  return events[0] || null
}

export function selectPrimaryAlert(alerts: DashboardAlert[]) {
  return alerts.find((alert) => !alert.acknowledged) || alerts[0] || null
}

export function buildDashboardOverview(
  data: RoomState | null,
  alerts: DashboardAlert[],
): DashboardOverview {
  const agents = data?.agents ?? []
  const latestEvent = selectLatestEvent(data?.events ?? [])
  const defaultAgent = selectDefaultAgent(agents)
  const primaryAlert = selectPrimaryAlert(alerts)
  const metrics = getDashboardAgentMetrics(agents)

  return {
    gateway: data?.gateway ?? null,
    roomMode: data?.roomMode === 'night' ? 'night' : 'day',
    primaryAlert,
    latestEvent,
    latestEventTime: formatTime(latestEvent?.at),
    latestSyncTime: formatTime(data?.updatedAt),
    defaultAgent,
    metrics,
    summaryTitle: defaultAgent
      ? `${defaultAgent.name} · ${defaultAgent.activityLabel}`
      : '等待 OpenClaw 接入房间状态',
    summaryDetail:
      latestEvent?.text || '暂无最近事件。完成网关接入后，这里会显示房间里的最新动态。',
  }
}
