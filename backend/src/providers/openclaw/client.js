import fs from 'node:fs'
import path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { createError } from './utils.js'

const execFile = promisify(execFileCallback)

const OPENCLAW_COMMAND = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw'
const CLI_MAX_BUFFER = 4 * 1024 * 1024

let windowsCliInvocationPromise = null

function normalizeGatewayWsUrl(baseUrl) {
  const url = new URL(baseUrl)

  if (url.protocol === 'http:') {
    url.protocol = 'ws:'
  } else if (url.protocol === 'https:') {
    url.protocol = 'wss:'
  }

  if (url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
  }

  url.hash = ''
  return url.toString().replace(/\/$/, '')
}

async function resolveWindowsCliInvocation() {
  if (!windowsCliInvocationPromise) {
    windowsCliInvocationPromise = execFile('where.exe', [OPENCLAW_COMMAND], {
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    })
      .then(({ stdout }) => {
        const shimPath = stdout
          .split(/\r?\n/g)
          .map((value) => value.trim())
          .find(Boolean)

        if (!shimPath) {
          throw createError('OpenClaw CLI 未安装到 PATH，无法执行 gateway call。')
        }

        const shimDir = path.dirname(shimPath)
        const scriptPath = path.join(shimDir, 'node_modules', 'openclaw', 'openclaw.mjs')
        const bundledNodePath = path.join(shimDir, 'node.exe')

        if (!fs.existsSync(scriptPath)) {
          throw createError(`未找到 OpenClaw CLI 入口文件: ${scriptPath}`)
        }

        return {
          file: fs.existsSync(bundledNodePath) ? bundledNodePath : process.execPath || 'node',
          leadingArgs: [scriptPath],
        }
      })
      .catch((error) => {
        windowsCliInvocationPromise = null
        throw error
      })
  }

  return windowsCliInvocationPromise
}

async function execGatewayCli(args, timeoutMs) {
  if (process.platform === 'win32') {
    const invocation = await resolveWindowsCliInvocation()

    return execFile(invocation.file, [...invocation.leadingArgs, ...args], {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: CLI_MAX_BUFFER,
    })
  }

  return execFile(OPENCLAW_COMMAND, args, {
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: CLI_MAX_BUFFER,
  })
}

async function callGatewayCliMethod(config, method, params) {
  if (!config.token) {
    throw createError('缺少 OpenClaw 认证密钥，无法读取网关详情。')
  }

  const cliTimeoutMs = Math.max(config.timeoutMs, 15000)
  const args = [
    'gateway',
    'call',
    method,
    '--url',
    normalizeGatewayWsUrl(config.baseUrl),
    '--token',
    config.token,
    '--json',
  ]

  if (params !== undefined) {
    args.push('--params', JSON.stringify(params))
  }

  let stdout = ''

  try {
    const result = await execGatewayCli(args, cliTimeoutMs)
    stdout = result.stdout || ''
  } catch (error) {
    const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : ''
    const output = typeof error?.stdout === 'string' ? error.stdout.trim() : ''
    const message = stderr || output || error?.message || String(error) || '未知错误'
    const isTimeout = error?.code === 'ETIMEDOUT' || error?.signal === 'SIGTERM'
    const isAuthFailure = /401|403|unauthorized|forbidden|invalid token|auth/i.test(message)
    const prefix = isTimeout
      ? 'OpenClaw 网关请求超时'
      : isAuthFailure
        ? 'OpenClaw 网关认证失败'
        : `OpenClaw 网关方法 ${method} 调用失败`

    throw createError(`${prefix}：${message}`, error)
  }

  try {
    return JSON.parse(stdout || 'null')
  } catch (error) {
    throw createError(`OpenClaw 网关方法 ${method} 返回了无法解析的 JSON。`, error)
  }
}

export function createGatewayClient(config) {
  async function invokeTool(tool, args = {}) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

    try {
      const headers = {
        'Content-Type': 'application/json',
      }

      if (config.token) {
        headers.Authorization = `Bearer ${config.token}`
      }

      if (config.messageChannel) {
        headers['x-openclaw-message-channel'] = config.messageChannel
      }

      if (config.accountId) {
        headers['x-openclaw-account-id'] = config.accountId
      }

      const response = await fetch(`${config.baseUrl}/tools/invoke`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool,
          action: 'json',
          args,
          sessionKey: config.sessionKey,
        }),
        signal: controller.signal,
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        const message =
          payload?.error?.message || `OpenClaw 网关调用 ${tool} 时返回 ${response.status}`
        throw createError(message)
      }

      return payload.result?.details ?? {}
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw createError('OpenClaw 网关请求超时', error)
      }

      throw createError(`OpenClaw 网关请求失败：${error?.message || String(error)}`, error)
    } finally {
      clearTimeout(timeout)
    }
  }

  async function callGatewayMethod(method, params) {
    return callGatewayCliMethod(config, method, params)
  }

  return {
    invokeTool,
    callGatewayMethod,
  }
}
