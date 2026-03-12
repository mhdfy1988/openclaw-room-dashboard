import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeGatewayMeta, normalizeGatewaySnapshot } from './normalizers.js'

test('normalizeGatewaySnapshot degrades gracefully when payload shapes drift', () => {
  const snapshot = normalizeGatewaySnapshot({
    sessionsData: {
      sessions: {
        broken: true,
      },
    },
    agentsData: null,
  })

  assert.deepEqual(snapshot.sessionsData.sessions, [])
  assert.deepEqual(snapshot.agentsData.agents, [])
  assert.ok(snapshot.warnings.length >= 1)
})

test('normalizeGatewayMeta records warnings for unexpected status and health payloads', () => {
  const meta = normalizeGatewayMeta({
    statusData: {
      sessions: {
        recent: null,
      },
    },
    healthData: 'oops',
    presenceData: null,
    errors: {
      status: 'status failed',
      health: null,
      systemPresence: null,
    },
  })

  assert.equal(meta.errors.length, 1)
  assert.equal(meta.methodErrors.status, 'status failed')
  assert.ok(meta.warnings.length >= 1)
})
