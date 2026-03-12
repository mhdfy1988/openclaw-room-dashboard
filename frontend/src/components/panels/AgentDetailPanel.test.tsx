import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AgentDetailPanel } from './AgentDetailPanel'
import { createAgentFixture } from '../../test/room-fixtures'

describe('AgentDetailPanel', () => {
  it('shows token metrics warning copy when token metrics are stale', () => {
    const baseAgent = createAgentFixture()
    const agent = createAgentFixture({
      runtime: {
        ...baseAgent.runtime!,
        tokenMetricsFresh: false,
      },
    })

    render(
      <AgentDetailPanel
        agent={agent}
        onClearSelection={vi.fn()}
        showClearSelection
      />,
    )

    expect(screen.getByText(/\u672a\u5237\u65b0/)).toBeInTheDocument()
  })
})
