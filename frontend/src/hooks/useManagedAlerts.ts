import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RoomAlert } from '../types/room'

const storageKey = 'room-dashboard.alert-state'

export type ManagedRoomAlert = RoomAlert & {
  acknowledged: boolean
}

function readStoredAlertState() {
  if (typeof window === 'undefined') {
    return {
      acknowledged: [] as string[],
      muted: [] as string[],
    }
  }

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      return {
        acknowledged: [] as string[],
        muted: [] as string[],
      }
    }

    const parsed = JSON.parse(raw)

    return {
      acknowledged: Array.isArray(parsed?.acknowledged)
        ? parsed.acknowledged.filter((value: unknown) => typeof value === 'string')
        : [],
      muted: Array.isArray(parsed?.muted)
        ? parsed.muted.filter((value: unknown) => typeof value === 'string')
        : [],
    }
  } catch {
    return {
      acknowledged: [] as string[],
      muted: [] as string[],
    }
  }
}

function keepOnlyActiveIds(ids: string[], activeIds: Set<string>) {
  return ids.filter((id) => activeIds.has(id))
}

export function useManagedAlerts(alerts: RoomAlert[]) {
  const initialState = useMemo(() => readStoredAlertState(), [])
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>(initialState.acknowledged)
  const [mutedIds, setMutedIds] = useState<string[]>(initialState.muted)

  const activeAlertIds = useMemo(() => new Set(alerts.map((alert) => alert.id)), [alerts])
  const activeAcknowledgedIds = useMemo(
    () => keepOnlyActiveIds(acknowledgedIds, activeAlertIds),
    [acknowledgedIds, activeAlertIds],
  )
  const activeMutedIds = useMemo(
    () => keepOnlyActiveIds(mutedIds, activeAlertIds),
    [mutedIds, activeAlertIds],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        acknowledged: activeAcknowledgedIds,
        muted: activeMutedIds,
      }),
    )
  }, [activeAcknowledgedIds, activeMutedIds])

  const visibleAlerts = useMemo(
    () =>
      alerts
        .filter((alert) => !activeMutedIds.includes(alert.id))
        .map((alert) => ({
          ...alert,
          acknowledged: activeAcknowledgedIds.includes(alert.id),
        })),
    [activeAcknowledgedIds, activeMutedIds, alerts],
  )

  const acknowledgeAlert = useCallback((id: string) => {
    setAcknowledgedIds((current) => (current.includes(id) ? current : [...current, id]))
  }, [])

  const muteAlert = useCallback((id: string) => {
    setMutedIds((current) => (current.includes(id) ? current : [...current, id]))
  }, [])

  const restoreMutedAlerts = useCallback(() => {
    setMutedIds([])
  }, [])

  return {
    alerts: visibleAlerts,
    mutedAlertCount: alerts.length - visibleAlerts.length,
    acknowledgeAlert,
    muteAlert,
    restoreMutedAlerts,
  }
}
