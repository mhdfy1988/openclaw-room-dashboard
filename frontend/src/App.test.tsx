import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import type { RoomState, RoomStreamState } from './types/room'
import { createRoomStateFixture } from './test/room-fixtures'

const mockedRoomState = vi.hoisted(() => ({
  data: null as RoomState | null,
  streamState: 'live' as RoomStreamState,
  refreshState: vi.fn(async () => null),
}))

vi.mock('./hooks/useRoomState', () => ({
  useRoomState: () => ({
    data: mockedRoomState.data,
    streamState: mockedRoomState.streamState,
    refreshState: mockedRoomState.refreshState,
  }),
}))

describe('App', () => {
  beforeEach(() => {
    mockedRoomState.data = createRoomStateFixture()
    mockedRoomState.streamState = 'live'
    mockedRoomState.refreshState.mockClear()
    window.localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
  })

  it('selects an agent, enters focus mode, and restores the overview when cleared', () => {
    render(<App />)

    expect(screen.getByText('gateway-client')).toBeInTheDocument()
    expect(document.querySelector('.event-list')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /main/i }))

    expect(window.location.search).toContain('agent=main')
    expect(document.querySelector('.detail-card')?.textContent).toContain('gpt-5.4')
    expect(screen.queryByText('gateway-client')).not.toBeInTheDocument()
    expect(document.querySelector('.event-list')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /\u8fd4\u56de\u623f\u95f4\u6982\u89c8/ }))

    expect(window.location.search).toBe('')
    expect(screen.getByText('gateway-client')).toBeInTheDocument()
    expect(document.querySelector('.event-list')).not.toBeNull()
  })

  it('supports deep-linking an agent from the query string', () => {
    window.history.replaceState({}, '', '/?agent=helper')

    render(<App />)

    expect(screen.getByText('vision-model')).toBeInTheDocument()
    expect(document.querySelector('.event-list')).toBeNull()
  })

  it('shows the merged stream error alert in the overview', () => {
    mockedRoomState.streamState = 'stream-error'

    render(<App />)

    expect(screen.getAllByText(/SSE/i).length).toBeGreaterThan(0)
  })

  it('shows degraded gateway placeholders instead of pretending counts are zero', () => {
    const baseState = createRoomStateFixture()
    mockedRoomState.data = {
      ...baseState,
      gateway: {
        ...baseState.gateway,
        status: 'degraded',
        connected: false,
        metaAvailable: false,
        metaErrors: ['SECURITY ERROR'],
        metaMethodErrors: {
          status: 'SECURITY ERROR',
          health: 'SECURITY ERROR',
          systemPresence: 'SECURITY ERROR',
        },
        activeSessionCount: null,
        totalSessionCount: null,
        configuredChannelCount: null,
        healthyChannelCount: null,
        connectionCount: null,
        channels: [],
      },
      connections: [],
    }

    render(<App />)

    expect(
      screen.getByText(/status \/ health \/ system-presence/i),
    ).toBeInTheDocument()
  })
})
