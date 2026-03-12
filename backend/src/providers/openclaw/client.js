import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { createError } from './utils.js'

const execFile = promisify(execFileCallback)

const OPENCLAW_COMMAND = process.platform === 'win32' ? 'openclaw.cmd' : 'openclaw'
const CLI_MAX_BUFFER = 4 * 1024 * 1024

let windowsCliInvocationPromise = null

function buildTimeoutError() {
  const error = createError('request timed out')
  error.code = 'ETIMEDOUT'
  return error
}

function collectErrorMessages(error) {
  const messages = []
  let current = error

  while (current) {
    if (typeof current?.message === 'string' && current.message.trim()) {
      messages.push(current.message.trim())
    }

    current = current.cause
  }

  return messages
}

function formatErrorMessage(error, fallback = '未知错误') {
  return collectErrorMessages(error).find(Boolean) || fallback
}

function isTlsTrustFailure(message) {
  const normalized = String(message || '').toLowerCase()

  return (
    normalized.includes('trust relationship') ||
    normalized.includes('self signed certificate') ||
    normalized.includes('unable to verify the first certificate') ||
    normalized.includes('unable to get local issuer certificate') ||
    normalized.includes('certificate has expired') ||
    normalized.includes("certificate's altnames") ||
    normalized.includes('hostname/ip does not match certificate') ||
    normalized.includes('secure channel') ||
    normalized.includes('cert_')
  )
}

function isPairingRequired(message) {
  return /pairing required/i.test(String(message || ''))
}

function isAuthFailure(message) {
  return /401|403|unauthorized|forbidden|invalid token|auth/i.test(String(message || ''))
}

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

async function postJson(urlString, { headers, payload, timeoutMs, allowInsecureTls = false }) {
  const url = new URL(urlString)
  const body = JSON.stringify(payload)
  const transport = url.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body),
        },
        rejectUnauthorized: url.protocol === 'https:' ? !allowInsecureTls : undefined,
      },
      (response) => {
        let responseBody = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => {
          responseBody += chunk
        })
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode || 0,
            body: responseBody,
          })
        })
      },
    )

    request.setTimeout(timeoutMs, () => {
      request.destroy(buildTimeoutError())
    })
    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

async function execGatewayCli(args, timeoutMs, { allowInsecureTls = false } = {}) {
  const env = allowInsecureTls
    ? {
        ...process.env,
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      }
    : process.env

  if (process.platform === 'win32') {
    const invocation = await resolveWindowsCliInvocation()

    return execFile(invocation.file, [...invocation.leadingArgs, ...args], {
      timeout: timeoutMs,
      windowsHide: true,
      maxBuffer: CLI_MAX_BUFFER,
      env,
    })
  }

  return execFile(OPENCLAW_COMMAND, args, {
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: CLI_MAX_BUFFER,
    env,
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
    const result = await execGatewayCli(args, cliTimeoutMs, {
      allowInsecureTls: config.allowInsecureTls === true,
    })
    stdout = result.stdout || ''
  } catch (error) {
    const stderr = typeof error?.stderr === 'string' ? error.stderr.trim() : ''
    const output = typeof error?.stdout === 'string' ? error.stdout.trim() : ''
    const message = stderr || output || formatErrorMessage(error)
    const prefix =
      error?.code === 'ETIMEDOUT' || error?.signal === 'SIGTERM'
        ? 'OpenClaw 网关请求超时'
        : isTlsTrustFailure(message)
          ? 'OpenClaw WSS 证书不受信'
          : isPairingRequired(message)
            ? 'OpenClaw 远程 Gateway 需要设备配对'
            : isAuthFailure(message)
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

      const response = await postJson(`${config.baseUrl}/tools/invoke`, {
        headers,
        payload: {
          tool,
          action: 'json',
          args,
          sessionKey: config.sessionKey,
        },
        timeoutMs: config.timeoutMs,
        allowInsecureTls: config.allowInsecureTls === true,
      })

      const payload = response.body ? JSON.parse(response.body) : null

      if (response.statusCode < 200 || response.statusCode >= 300 || !payload?.ok) {
        const message =
          payload?.error?.message || `OpenClaw 网关调用 ${tool} 时返回 ${response.statusCode}`
        throw createError(message)
      }

      return payload.result?.details ?? {}
    } catch (error) {
      if (error?.code === 'ETIMEDOUT') {
        throw createError('OpenClaw 网关请求超时', error)
      }

      const message = formatErrorMessage(error)
      const prefix = isTlsTrustFailure(message)
        ? 'OpenClaw HTTPS 证书不受信'
        : isPairingRequired(message)
          ? 'OpenClaw 远程 Gateway 需要设备配对'
          : isAuthFailure(message)
            ? 'OpenClaw 网关认证失败'
            : 'OpenClaw 网关请求失败'

      throw createError(`${prefix}：${message}`, error)
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
