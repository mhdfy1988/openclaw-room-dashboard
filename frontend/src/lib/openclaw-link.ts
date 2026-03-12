import type { OpenClawLinkDraft } from '../types/openclaw'

function coerceUrl(rawUrl: string) {
  if (/^[a-z]+:\/\//i.test(rawUrl)) {
    return new URL(rawUrl)
  }

  return new URL(`http://${rawUrl}`)
}

export function splitGatewayInput(rawUrl: string) {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return {
      url: '',
      token: '',
    }
  }

  try {
    const url = coerceUrl(trimmed)
    let token = url.searchParams.get('token') ?? ''

    if (token) {
      url.searchParams.delete('token')
    }

    if (url.hash) {
      const hashParams = new URLSearchParams(url.hash.slice(1))
      token = token || hashParams.get('token') || ''
      url.hash = ''
    }

    if (url.protocol === 'ws:') {
      url.protocol = 'http:'
    } else if (url.protocol === 'wss:') {
      url.protocol = 'https:'
    }

    url.username = ''
    url.password = ''
    if (url.pathname.endsWith('/')) {
      url.pathname = url.pathname.replace(/\/+$/, '')
    }

    return {
      url: url.toString().replace(/\/$/, ''),
      token,
    }
  } catch {
    return {
      url: trimmed,
      token: '',
    }
  }
}

function readParam(url: URL, key: string) {
  return url.searchParams.get(key) ?? new URLSearchParams(url.hash.slice(1)).get(key)
}

function deleteParam(url: URL, key: string) {
  url.searchParams.delete(key)

  if (url.hash) {
    const hashParams = new URLSearchParams(url.hash.slice(1))
    hashParams.delete(key)
    const nextHash = hashParams.toString()
    url.hash = nextHash ? `#${nextHash}` : ''
  }
}

export function consumeOpenClawLinkDraftFromLocation(): OpenClawLinkDraft | null {
  const url = new URL(window.location.href)
  const rawUrl = readParam(url, 'openclaw_url')
  const rawToken = readParam(url, 'openclaw_token')
  const rawSessionKey = readParam(url, 'openclaw_session_key')
  const rawEnabled = readParam(url, 'openclaw_enabled')

  if (!rawUrl && !rawToken && !rawSessionKey && !rawEnabled) {
    return null
  }

  const nextUrl = new URL(window.location.href)
  deleteParam(nextUrl, 'openclaw_url')
  deleteParam(nextUrl, 'openclaw_token')
  deleteParam(nextUrl, 'openclaw_session_key')
  deleteParam(nextUrl, 'openclaw_enabled')
  window.history.replaceState({}, document.title, `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)

  return {
    url: rawUrl ?? '',
    token: rawToken ?? '',
    sessionKey: rawSessionKey ?? 'main',
    enabled: rawEnabled == null ? true : !['0', 'false', 'no', 'off'].includes(rawEnabled.toLowerCase()),
    notice: '已从链接导入 OpenClaw 配置，地址栏中的 token 已自动隐藏。',
  }
}
