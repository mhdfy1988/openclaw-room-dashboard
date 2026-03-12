import assert from 'node:assert/strict'
import test from 'node:test'
import { createGatewayErrorState, fetchOpenClawRoomState } from './room-state.js'

function createClientFixture(now) {
  return {
    async invokeTool(name) {
      if (name === 'sessions_list') {
        return {
          sessions: [
            {
              key: 'agent:main:main',
              sessionId: 'session-webchat',
              kind: 'session',
              channel: 'webchat',
              model: 'gpt-5.4',
              updatedAt: now - 10_000,
            },
            {
              key: 'agent:main:feishu:direct:123',
              sessionId: 'session-feishu',
              kind: 'session',
              channel: 'feishu',
              model: 'vision-model',
              updatedAt: now - 20_000,
            },
            {
              key: 'agent:helper:main',
              sessionId: 'session-helper',
              kind: 'session',
              channel: 'webchat',
              model: 'gpt-4.1-mini',
              updatedAt: now - 30_000,
            },
          ],
        }
      }

      if (name === 'agents_list') {
        return {
          requester: 'main',
          agents: [
            { id: 'main', name: 'Main', configured: true },
            { id: 'helper', name: 'Helper', configured: true },
          ],
        }
      }

      throw new Error(`Unexpected tool ${name}`)
    },
  }
}

test('fetchOpenClawRoomState keeps latest events across sessions', async () => {
  const now = Date.parse('2026-03-12T09:40:00.000Z')
  const state = await fetchOpenClawRoomState(
    createClientFixture(now),
    {
      publicBaseUrl: 'http://127.0.0.1:18789',
      alertThresholds: {},
    },
    now,
    {
      statusData: null,
      healthData: null,
      presenceData: [],
      warnings: [],
      errors: [],
      methodErrors: {
        status: null,
        health: null,
        systemPresence: null,
      },
      statusAvailable: false,
      healthAvailable: false,
      presenceAvailable: false,
    },
  )

  assert.equal(state.events.length, 3)
  assert.deepEqual(
    state.events.map((event) => event.id),
    ['session-webchat', 'session-feishu', 'session-helper'],
  )
  assert.equal(state.gateway.status, 'degraded')
  assert.equal(state.gateway.activeSessionCount, null)
  assert.equal(state.gateway.connectionCount, null)
})

test('createGatewayErrorState returns a fallback room state', () => {
  const now = Date.parse('2026-03-12T09:40:00.000Z')
  const state = createGatewayErrorState(
    {
      publicBaseUrl: 'http://127.0.0.1:18789',
      alertThresholds: {},
    },
    new Error('gateway offline'),
    now,
  )

  assert.equal(state.gateway.connected, false)
  assert.equal(state.gateway.lastError, 'gateway offline')
  assert.equal(state.events[0].id, 'openclaw-gateway-error')
})
