import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { createEmptyRoomState } from '../state/empty-room-state.js'
import { createMockRoomState } from '../state/mock-room-state.js'
import {
  loadOpenClawFileConfig,
  sanitizeOpenClawConfigForClient,
  saveOpenClawFileConfig,
} from '../config/openclaw-config.js'
import {
  createOpenClawRoomStateProvider,
  testOpenClawGatewayConfig,
} from '../providers/openclaw/gateway.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function createApp({ prod = false } = {}) {
  const fastify = Fastify({ logger: true })
  const roomStateProvider = createOpenClawRoomStateProvider({ logger: fastify.log })
  const defaultMockModeEnabled = process.env.ROOM_DASHBOARD_USE_MOCK === 'true'
  let mockModeEnabled = defaultMockModeEnabled
  const streamClients = new Set()
  let streamTimer = null
  let streamInFlight = null
  let latestStreamPayload = ''
  let latestStreamPayloadAt = 0

  function getHealthPayload() {
    const providerHealth = roomStateProvider.getHealthSnapshot()

    return {
      ...providerHealth,
      source: mockModeEnabled ? 'mock' : providerHealth.source,
      fallbackMode: mockModeEnabled ? 'mock' : 'empty',
      mockModeEnabled,
    }
  }

  function getConfigPayload() {
    const fileConfig = loadOpenClawFileConfig()

    return {
      config: {
        ...sanitizeOpenClawConfigForClient(fileConfig.config),
        filePath: fileConfig.filePath,
        fileExists: fileConfig.exists,
        fileError: fileConfig.error,
      },
      health: getHealthPayload(),
    }
  }

  async function getRoomState() {
    if (mockModeEnabled) {
      return createMockRoomState()
    }

    if (roomStateProvider.isConfigured) {
      return roomStateProvider.getState()
    }

    return createEmptyRoomState()
  }

  function serializeRoomState(roomState) {
    return `event: state-update\ndata: ${JSON.stringify(roomState)}\n\n`
  }

  function clearStreamTimer() {
    if (streamTimer) {
      clearTimeout(streamTimer)
      streamTimer = null
    }
  }

  function dropStreamClient(client) {
    streamClients.delete(client)

    if (streamClients.size === 0) {
      clearStreamTimer()
    }
  }

  async function getStreamPayload({ force = false } = {}) {
    const now = Date.now()

    if (!force && latestStreamPayload && now - latestStreamPayloadAt < 1000) {
      return latestStreamPayload
    }

    const roomState = await getRoomState()
    latestStreamPayload = serializeRoomState(roomState)
    latestStreamPayloadAt = Date.now()
    return latestStreamPayload
  }

  async function broadcastRoomState({ force = false } = {}) {
    if (streamClients.size === 0) {
      return
    }

    if (!streamInFlight) {
      streamInFlight = (async () => {
        const payload = await getStreamPayload({ force })

        for (const client of [...streamClients]) {
          if (client.destroyed || client.writableEnded) {
            dropStreamClient(client)
            continue
          }

          try {
            client.write(payload)
          } catch (error) {
            dropStreamClient(client)
            fastify.log.warn({ err: error }, 'room stream write failed')
          }
        }
      })()
        .catch((error) => {
          fastify.log.error({ err: error }, 'room stream broadcast failed')
        })
        .finally(() => {
          streamInFlight = null
        })
    }

    return streamInFlight
  }

  function scheduleStreamBroadcast() {
    if (streamTimer || streamClients.size === 0) {
      return
    }

    streamTimer = setTimeout(async () => {
      streamTimer = null

      try {
        await broadcastRoomState({ force: true })
      } finally {
        if (streamClients.size > 0) {
          scheduleStreamBroadcast()
        }
      }
    }, 5000)
  }

  await fastify.register(cors, {
    origin: true,
  })

  fastify.get('/api/health', async () => {
    if (!mockModeEnabled && roomStateProvider.isConfigured) {
      await roomStateProvider.getState()
    }

    return {
      ok: true,
      mode: prod ? 'prod' : 'dev',
      ...getHealthPayload(),
    }
  })

  fastify.get('/api/room/state', async () => {
    return getRoomState()
  })

  fastify.get('/api/openclaw/config', async () => getConfigPayload())

  fastify.post('/api/openclaw/config/test', async (request, reply) => {
    try {
      const fileConfig = loadOpenClawFileConfig().config
      const body = (request.body && typeof request.body === 'object' ? request.body : {}) || {}
      const draft = {
        enabled: body.enabled,
        url: body.url,
        token: typeof body.token === 'string' && body.token.trim() ? body.token : fileConfig.token,
        sessionKey: body.sessionKey ?? fileConfig.sessionKey,
        timeoutMs: body.timeoutMs ?? fileConfig.timeoutMs,
        messageChannel: body.messageChannel ?? fileConfig.messageChannel,
        accountId: body.accountId ?? fileConfig.accountId,
        allowInsecureTls: body.allowInsecureTls ?? fileConfig.allowInsecureTls,
        alertThresholds: body.alertThresholds ?? fileConfig.alertThresholds,
      }
      const result = await testOpenClawGatewayConfig(draft)
      return {
        ok: true,
        result,
      }
    } catch (error) {
      reply.code(400)
      return {
        ok: false,
        error: error?.message || String(error),
      }
    }
  })

  fastify.post('/api/openclaw/config', async (request, reply) => {
    try {
      const body = (request.body && typeof request.body === 'object' ? request.body : {}) || {}
      const clearSavedToken = body.clearSavedToken === true
      const saved = saveOpenClawFileConfig(
        {
          enabled: body.enabled,
          url: body.url,
          token: clearSavedToken ? '' : body.token,
          sessionKey: body.sessionKey,
          timeoutMs: body.timeoutMs,
          messageChannel: body.messageChannel,
          accountId: body.accountId,
          allowInsecureTls: body.allowInsecureTls,
          alertThresholds: body.alertThresholds,
        },
        { preserveExistingToken: !clearSavedToken },
      )

      roomStateProvider.refreshConfig()
      latestStreamPayload = ''
      latestStreamPayloadAt = 0
      void broadcastRoomState({ force: true })

      return {
        ok: true,
        config: {
          ...sanitizeOpenClawConfigForClient(saved.config),
          filePath: saved.filePath,
          fileExists: true,
          fileError: null,
        },
        health: getHealthPayload(),
      }
    } catch (error) {
      reply.code(400)
      return {
        ok: false,
        error: error?.message || String(error),
      }
    }
  })

  fastify.post('/api/mock-mode', async (request, reply) => {
    try {
      const body = (request.body && typeof request.body === 'object' ? request.body : {}) || {}
      mockModeEnabled = body.enabled === true
      latestStreamPayload = ''
      latestStreamPayloadAt = 0

      if (!mockModeEnabled && roomStateProvider.isConfigured) {
        await roomStateProvider.getState()
      }

      void broadcastRoomState({ force: true })

      return {
        ok: true,
        health: getHealthPayload(),
      }
    } catch (error) {
      reply.code(400)
      return {
        ok: false,
        error: error?.message || String(error),
      }
    }
  })

  fastify.get('/api/room/events', async () => {
    const state = await getRoomState()
    return state.events
  })

  fastify.get('/api/room/stream', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    })
    const client = reply.raw
    streamClients.add(client)

    request.raw.on('close', () => {
      dropStreamClient(client)
      if (!client.writableEnded) {
        client.end()
      }
    })

    try {
      const initialPayload = await getStreamPayload()
      client.write(initialPayload)
      scheduleStreamBroadcast()
    } catch (error) {
      dropStreamClient(client)
      fastify.log.error({ err: error }, 'room stream initial write failed')
      reply.raw.end()
    }
  })

  if (prod) {
    const root = path.resolve(__dirname, '../../../frontend/dist')
    await fastify.register(fastifyStatic, {
      root,
      prefix: '/',
    })
  }

  return fastify
}
