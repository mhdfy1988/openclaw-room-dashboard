import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Agent } from '../types/room'

type UseSelectedAgentParams = {
  agents: Agent[]
}

const selectedAgentParam = 'agent'

function readSelectedAgentIdFromLocation() {
  if (typeof window === 'undefined') {
    return null
  }

  const value = new URL(window.location.href).searchParams.get(selectedAgentParam)
  return value?.trim() || null
}

function syncSelectedAgentIdToLocation(selectedId: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  const nextUrl = new URL(window.location.href)

  if (selectedId) {
    nextUrl.searchParams.set(selectedAgentParam, selectedId)
  } else {
    nextUrl.searchParams.delete(selectedAgentParam)
  }

  window.history.replaceState({}, document.title, `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
}

export function useSelectedAgent({ agents }: UseSelectedAgentParams) {
  const [selectedId, setSelectedId] = useState<string | null>(() => readSelectedAgentIdFromLocation())

  const selectedAgent = useMemo(
    () => (selectedId ? agents.find((agent) => agent.id === selectedId) ?? null : null),
    [agents, selectedId],
  )

  useEffect(() => {
    syncSelectedAgentIdToLocation(selectedAgent?.id ?? null)
  }, [selectedAgent?.id])

  const selectAgent = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedId(null)
  }, [])

  return {
    selectedId,
    selectedAgent,
    selectAgent,
    clearSelection,
  }
}
