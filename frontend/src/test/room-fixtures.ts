import type { Agent, RoomState } from '../types/room'

export function createAgentFixture(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'main',
    name: 'Main',
    role: 'controller',
    emoji: '',
    fallbackIcon: '',
    theme: 'openclaw-agent',
    status: 'working',
    activityLabel: 'Working in webchat',
    currentTask: 'gpt-5.4',
    isDefault: true,
    canDispatchTo: ['helper'],
    lastSeenAt: '2026-03-12T09:36:55.000Z',
    roomZone: 'center-console',
    runtime: {
      sessionKey: 'agent:main:main',
      sessionId: 'session-main',
      sessionKind: 'session',
      channel: 'webchat',
      displayName: 'Main',
      accountId: 'acct-main',
      lastTarget: 'room',
      model: 'gpt-5.4',
      contextTokens: 200000,
      totalTokens: 76868,
      inputTokens: 76868,
      outputTokens: 87,
      remainingTokens: 123132,
      percentUsed: 38,
      tokenMetricsFresh: true,
      transcriptPath: null,
      abortedLastRun: false,
    },
    ...overrides,
  }
}

export function createRoomStateFixture(overrides: Partial<RoomState> = {}): RoomState {
  const mainAgent = createAgentFixture()
  const helperAgent = createAgentFixture({
    id: 'helper',
    name: 'Helper',
    role: 'work',
    isDefault: false,
    status: 'thinking',
    activityLabel: 'Thinking in feishu',
    roomZone: 'work-desk',
    runtime: {
      ...mainAgent.runtime,
      sessionKey: 'agent:helper:main',
      sessionId: 'session-helper',
      channel: 'feishu',
      model: 'vision-model',
    },
  })

  return {
    updatedAt: '2026-03-12T09:37:10.000Z',
    roomMode: 'day',
    agents: [mainAgent, helperAgent],
    events: [
      {
        id: 'evt-main',
        agentId: 'main',
        type: 'session',
        text: 'Main uses gpt-5.4.',
        at: '2026-03-12T09:36:55.000Z',
      },
      {
        id: 'evt-helper',
        agentId: 'helper',
        type: 'session',
        text: 'Helper uses vision-model.',
        at: '2026-03-12T09:35:35.000Z',
      },
    ],
    gateway: {
      status: 'connected',
      connected: true,
      metaAvailable: true,
      metaErrors: [],
      metaMethodErrors: {
        status: null,
        health: null,
        systemPresence: null,
      },
      gatewayUrl: 'http://127.0.0.1:18789',
      defaultAgentId: 'main',
      activeSessionCount: 2,
      totalSessionCount: 2,
      configuredChannelCount: 1,
      healthyChannelCount: 1,
      connectionCount: 1,
      heartbeatEvery: '30s',
      lastSuccessAt: '2026-03-12T09:37:10.000Z',
      lastError: null,
      channels: [
        {
          id: 'feishu',
          label: 'Feishu',
          configured: true,
          healthy: true,
          running: true,
          accountCount: 1,
          accountIds: ['acct-main'],
          lastError: null,
        },
      ],
    },
    connections: [
      {
        id: 'gateway-client',
        host: 'gateway-client',
        ip: '198.18.0.1',
        version: '2026.3.8',
        mode: 'backend',
        summary: 'Node gateway-client connected',
        lastSeenAt: '2026-03-12T09:37:00.000Z',
      },
    ],
    alerts: [],
    ...overrides,
  }
}
