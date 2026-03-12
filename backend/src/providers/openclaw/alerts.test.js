import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAlerts } from './alerts.js'

test('buildAlerts reports unhealthy configured channels', () => {
  const alerts = buildAlerts({
    agents: [],
    gateway: {
      connected: true,
      healthyChannelCount: 0,
      channels: [
        {
          id: 'feishu',
          label: 'Feishu',
          configured: true,
          healthy: false,
          lastError: 'probe failed',
        },
      ],
    },
    now: Date.now(),
  })

  assert.ok(alerts.some((alert) => alert.id === 'gateway-channels-unhealthy'))
})

test('buildAlerts reports stale token metrics when token usage exists', () => {
  const alerts = buildAlerts({
    agents: [
      {
        id: 'main',
        name: 'Main',
        status: 'working',
        runtime: {
          inputTokens: 100,
          outputTokens: 20,
          tokenMetricsFresh: false,
        },
      },
    ],
    gateway: {
      connected: true,
      channels: [],
    },
    now: Date.now(),
  })

  assert.ok(alerts.some((alert) => alert.id === 'token-metrics-stale-main'))
})

test('buildAlerts honors custom token thresholds', () => {
  const alerts = buildAlerts({
    agents: [
      {
        id: 'main',
        name: 'Main',
        status: 'working',
        runtime: {
          percentUsed: 55,
          remainingTokens: 900,
        },
      },
    ],
    gateway: {
      connected: true,
      channels: [],
    },
    now: Date.now(),
    thresholds: {
      tokenWarningPercent: 50,
      tokenCriticalPercent: 60,
    },
  })

  const tokenAlert = alerts.find((alert) => alert.id === 'token-pressure-main')
  assert.ok(tokenAlert)
  assert.equal(tokenAlert.severity, 'warning')
})

test('buildAlerts reports remote gateway security restrictions as degraded access', () => {
  const alerts = buildAlerts({
    agents: [],
    gateway: {
      status: 'degraded',
      gatewayUrl: 'http://172.16.71.151:18789',
      metaErrors: [
        'Gateway call failed: Error: SECURITY ERROR: Gateway URL "ws://172.16.71.151:18789" uses plaintext ws:// to a non-loopback address.',
      ],
      metaMethodErrors: {
        status: 'security error',
        health: 'security error',
        systemPresence: 'security error',
      },
      channels: [],
    },
    now: Date.now(),
  })

  const degradedAlert = alerts.find((alert) => alert.id === 'gateway-remote-security')
  assert.ok(degradedAlert)
  assert.match(degradedAlert.detail, /wss:\/\//i)
})
