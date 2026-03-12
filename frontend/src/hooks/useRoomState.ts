import { useCallback, useEffect, useRef, useState } from 'react'
import { isRoomStatePayload } from '../lib/room-state'
import type { RoomState, RoomStreamState } from '../types/room'

const apiBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || ''
const roomStateUrl = `${apiBase}/api/room/state`
const roomStreamUrl = `${apiBase}/api/room/stream`

function toRequestError(status: number) {
  return new Error(`Room state request failed with ${status}`)
}

export function useRoomState() {
  const [data, setData] = useState<RoomState | null>(null)
  const [streamState, setStreamState] = useState<RoomStreamState>('connecting')
  const hasRoomStateRef = useRef(false)
  const hasLiveStreamRef = useRef(false)

  const commitRoomState = useCallback((next: RoomState) => {
    hasRoomStateRef.current = true
    setData(next)
  }, [])

  const refreshState = useCallback(async () => {
    try {
      const response = await fetch(roomStateUrl)

      if (!response.ok) {
        throw toRequestError(response.status)
      }

      const payload: unknown = await response.json()

      if (!isRoomStatePayload(payload)) {
        throw new Error('Room state payload shape is invalid')
      }

      commitRoomState(payload)
      setStreamState((current) => {
        if (current === 'refresh-error') {
          return hasLiveStreamRef.current ? 'live' : 'connecting'
        }

        if (current === 'initial-error') {
          return 'connecting'
        }

        return current
      })

      return payload
    } catch {
      setStreamState(hasRoomStateRef.current ? 'refresh-error' : 'initial-error')
      return null
    }
  }, [commitRoomState])

  useEffect(() => {
    void refreshState()

    const source = new EventSource(roomStreamUrl)

    const handleStateUpdate = (event: Event) => {
      try {
        const payload: unknown = JSON.parse((event as MessageEvent).data)

        if (!isRoomStatePayload(payload)) {
          throw new Error('Room state payload shape is invalid')
        }

        hasLiveStreamRef.current = true
        commitRoomState(payload)
        setStreamState('live')
      } catch {
        setStreamState(hasRoomStateRef.current ? 'stream-error' : 'initial-error')
      }
    }

    source.addEventListener('state-update', handleStateUpdate)
    source.onerror = () => {
      setStreamState(hasRoomStateRef.current ? 'stream-error' : 'initial-error')
    }

    return () => {
      source.removeEventListener('state-update', handleStateUpdate)
      source.close()
    }
  }, [commitRoomState, refreshState])

  return {
    data,
    streamState,
    refreshState,
  }
}
