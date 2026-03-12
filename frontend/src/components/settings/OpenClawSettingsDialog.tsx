import { useEffect, useState } from 'react'
import './openclaw-settings-dialog.css'
import { formatOptionalMetric } from '../../lib/format'
import { splitGatewayInput } from '../../lib/openclaw-link'
import type {
  OpenClawConfigDraft,
  OpenClawConfigResponse,
  OpenClawConfigView,
  OpenClawHealth,
  OpenClawLinkDraft,
  OpenClawTestResult,
} from '../../types/openclaw'

const apiBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim() || ''

const defaultAlertThresholds = {
  agentStaleWarningMs: 10 * 60 * 1000,
  agentStaleCriticalMs: 30 * 60 * 1000,
  tokenWarningPercent: 80,
  tokenCriticalPercent: 90,
}

const emptyDraft: OpenClawConfigDraft = {
  enabled: true,
  url: '',
  token: '',
  sessionKey: 'main',
  timeoutMs: 6000,
  messageChannel: '',
  accountId: '',
  allowInsecureTls: false,
  alertThresholds: defaultAlertThresholds,
  clearSavedToken: false,
}

type OpenClawSettingsDialogProps = {
  open: boolean
  linkDraft: OpenClawLinkDraft | null
  onConsumeLinkDraft: () => void
  onClose: () => void
  onSaved: () => void
}

type ThresholdKey = keyof OpenClawConfigDraft['alertThresholds']

function buildDraft(config: OpenClawConfigView): OpenClawConfigDraft {
  return {
    enabled: config.enabled,
    url: config.url,
    token: '',
    sessionKey: config.sessionKey || 'main',
    timeoutMs: config.timeoutMs || 6000,
    messageChannel: config.messageChannel || '',
    accountId: config.accountId || '',
    allowInsecureTls: config.allowInsecureTls === true,
    alertThresholds: config.alertThresholds || defaultAlertThresholds,
    clearSavedToken: false,
  }
}

function applyLinkDraft(current: OpenClawConfigDraft, linkDraft: OpenClawLinkDraft | null) {
  if (!linkDraft) {
    return current
  }

  const next = {
    ...current,
    enabled: typeof linkDraft.enabled === 'boolean' ? linkDraft.enabled : current.enabled,
    url: typeof linkDraft.url === 'string' ? linkDraft.url : current.url,
    token: typeof linkDraft.token === 'string' ? linkDraft.token : current.token,
    sessionKey: typeof linkDraft.sessionKey === 'string' ? linkDraft.sessionKey : current.sessionKey,
    clearSavedToken: false,
  }

  const extracted = splitGatewayInput(next.url)
  return {
    ...next,
    url: extracted.url,
    token: next.token || extracted.token,
  }
}

function getSourceLabel(configSource?: string) {
  if (!configSource || configSource === 'none') {
    return '未配置'
  }

  if (configSource === 'file') {
    return '本地配置文件'
  }

  if (configSource === 'env') {
    return '环境变量'
  }

  if (configSource === 'env+file') {
    return '环境变量 + 配置文件'
  }

  if (configSource === 'request') {
    return '仅本次测试'
  }

  return configSource
}

function toMinutes(value: number) {
  return Math.max(0, Math.round(value / 60000))
}

function toMsFromMinutes(value: number) {
  return Math.max(0, Math.round(value * 60000))
}

function getHealthStatusLabel(health?: OpenClawHealth | null) {
  if (health?.mockModeEnabled) {
    return '本地演示数据'
  }

  if (health?.status === 'connected') {
    return '已连接'
  }

  if (health?.status === 'degraded') {
    return '部分可用'
  }

  return '未连接'
}

function getHealthDegradedMessage(health?: OpenClawHealth | null) {
  if (health?.status !== 'degraded') {
    return null
  }

  const messages = Array.isArray(health.metaErrors) ? health.metaErrors : []
  const combinedMessage = messages.join(' ')

  if (/security error|plaintext ws:\/\//i.test(combinedMessage)) {
    return '远程 Gateway 拒绝明文 ws://，当前只能拿到部分数据。请改用 wss://、SSH 隧道或 Tailscale。'
  }

  if (/pairing required/i.test(combinedMessage)) {
    return '远程 Gateway 尚未批准当前设备，当前只能拿到部分数据。请先在远端完成 devices approve。'
  }

  return '远程 Gateway 当前只返回了部分元信息，渠道、连接数和部分实时统计会缺失。'
}

export function OpenClawSettingsDialog({
  open,
  linkDraft,
  onConsumeLinkDraft,
  onClose,
  onSaved,
}: OpenClawSettingsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [mockSwitching, setMockSwitching] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [draft, setDraft] = useState<OpenClawConfigDraft>(emptyDraft)
  const [savedConfig, setSavedConfig] = useState<OpenClawConfigView | null>(null)
  const [health, setHealth] = useState<OpenClawHealth | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<OpenClawTestResult | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    let disposed = false
    setLoading(true)
    setError('')

    fetch(`${apiBase}/api/openclaw/config`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`读取配置失败：${response.status}`)
        }

        return (await response.json()) as OpenClawConfigResponse
      })
      .then((payload) => {
        if (disposed) {
          return
        }

        setSavedConfig(payload.config)
        setHealth(payload.health)
        setDraft(applyLinkDraft(buildDraft(payload.config), linkDraft))
        setTestResult(null)
        setNotice(linkDraft?.notice || '')
        if (linkDraft) {
          onConsumeLinkDraft()
        }
      })
      .catch((nextError: Error) => {
        if (!disposed) {
          setError(nextError.message)
        }
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false)
        }
      })

    return () => {
      disposed = true
    }
  }, [open, linkDraft, onConsumeLinkDraft])

  function updateDraft<K extends keyof OpenClawConfigDraft>(key: K, value: OpenClawConfigDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function updateThreshold(key: ThresholdKey, value: number) {
    setDraft((current) => ({
      ...current,
      alertThresholds: {
        ...current.alertThresholds,
        [key]: value,
      },
    }))
  }

  function absorbTokenizedUrl() {
    const extracted = splitGatewayInput(draft.url)
    if (!extracted.token) {
      return {
        ...draft,
        url: extracted.url,
      }
    }

    const nextDraft = {
      ...draft,
      url: extracted.url,
      token: draft.token || extracted.token,
      clearSavedToken: false,
    }

    setDraft(nextDraft)
    return nextDraft
  }

  async function runTest() {
    const nextDraft = absorbTokenizedUrl()
    setTesting(true)
    setError('')
    setNotice('')
    setTestResult(null)

    try {
      const response = await fetch(`${apiBase}/api/openclaw/config/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nextDraft),
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `测试连接失败：${response.status}`)
      }

      setTestResult(payload.result as OpenClawTestResult)
      setNotice('连接测试通过。')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setTesting(false)
    }
  }

  async function saveConfig() {
    const nextDraft = absorbTokenizedUrl()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(`${apiBase}/api/openclaw/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nextDraft),
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `保存配置失败：${response.status}`)
      }

      const nextConfig = payload.config as OpenClawConfigView
      const nextHealth = payload.health as OpenClawHealth

      setSavedConfig(nextConfig)
      setHealth(nextHealth)
      setDraft(buildDraft(nextConfig))
      setNotice('配置已保存，密钥已重新隐藏。')
      setTestResult(null)
      onSaved()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setSaving(false)
    }
  }

  async function toggleMockMode() {
    const nextEnabled = !health?.mockModeEnabled
    setMockSwitching(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(`${apiBase}/api/mock-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: nextEnabled }),
      })
      const payload = await response.json()

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `切换 Mock 模式失败：${response.status}`)
      }

      setHealth(payload.health as OpenClawHealth)
      setNotice(
        nextEnabled
          ? '已切换到 Mock 模式，现在展示的是本地演示数据。'
          : '已退出 Mock 模式，面板将恢复真实网关或空态数据。',
      )
      onSaved()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setMockSwitching(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="settings-overlay" role="presentation" onClick={onClose}>
      <section
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="openclaw-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-header">
          <div>
            <p className="settings-kicker">接入设置</p>
            <h2 id="openclaw-settings-title">OpenClaw 连接配置</h2>
          </div>
          <button className="settings-close" type="button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="settings-status-grid">
          <article className="settings-status-card">
            <span>当前来源</span>
            <strong>{health?.mockModeEnabled ? 'Mock 模式' : getSourceLabel(health?.configSource)}</strong>
          </article>
          <article className="settings-status-card">
            <span>网关地址</span>
            <strong>{health?.gatewayUrl || '尚未配置'}</strong>
          </article>
          <article className="settings-status-card">
            <span>连接状态</span>
            <strong>{getHealthStatusLabel(health)}</strong>
          </article>
          <article className="settings-status-card">
            <span>结构告警</span>
            <strong>{health?.schemaWarningCount ?? 0}</strong>
          </article>
        </div>

        {loading ? <p className="settings-message">正在读取当前配置...</p> : null}
        {savedConfig?.fileError ? <p className="settings-error">{savedConfig.fileError}</p> : null}
        {health?.lastError ? <p className="settings-error">{health.lastError}</p> : null}
        {getHealthDegradedMessage(health) ? (
          <p className="settings-warning">{getHealthDegradedMessage(health)}</p>
        ) : null}
        {error ? <p className="settings-error">{error}</p> : null}
        {notice ? <p className="settings-notice">{notice}</p> : null}

        <div className="settings-form-grid">
          <div className="settings-checkbox-grid">
            <label className="settings-field settings-field-checkbox">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(event) => updateDraft('enabled', event.target.checked)}
              />
              <span>启用 OpenClaw 接入</span>
            </label>

            <label className="settings-field settings-field-checkbox">
              <input
                type="checkbox"
                checked={draft.allowInsecureTls}
                onChange={(event) => updateDraft('allowInsecureTls', event.target.checked)}
              />
              <span>临时忽略 HTTPS / WSS 证书校验，仅用于代理测试</span>
            </label>
          </div>

          <label className="settings-field settings-field-full">
            <span>网关地址或完整带密钥的链接</span>
            <input
              type="text"
              value={draft.url}
              onChange={(event) => updateDraft('url', event.target.value)}
              onBlur={absorbTokenizedUrl}
              placeholder="例如：http://127.0.0.1:18789"
            />
          </label>

          <label className="settings-field settings-field-full">
            <span>认证密钥</span>
            <div className="settings-token-row">
              <input
                type={showToken ? 'text' : 'password'}
                value={draft.token}
                onChange={(event) => {
                  updateDraft('token', event.target.value)
                  if (event.target.value.trim()) {
                    updateDraft('clearSavedToken', false)
                  }
                }}
                placeholder={savedConfig?.hasToken ? '留空表示继续使用已保存的密钥' : '请输入认证密钥'}
              />
              <button type="button" onClick={() => setShowToken((current) => !current)}>
                {showToken ? '隐藏' : '显示'}
              </button>
            </div>
            {savedConfig?.hasToken ? (
              <div className="settings-token-meta">
                <span>已保存密钥：{savedConfig.maskedToken}</span>
                <button
                  type="button"
                  className={draft.clearSavedToken ? 'danger' : ''}
                  onClick={() => updateDraft('clearSavedToken', !draft.clearSavedToken)}
                >
                  {draft.clearSavedToken ? '将移除已保存密钥' : '移除已保存密钥'}
                </button>
              </div>
            ) : null}
          </label>

          <label className="settings-field">
            <span>会话键</span>
            <input
              type="text"
              value={draft.sessionKey}
              onChange={(event) => updateDraft('sessionKey', event.target.value)}
              placeholder="main"
            />
          </label>

          <label className="settings-field">
            <span>超时时间（毫秒）</span>
            <input
              type="number"
              min={1000}
              step={500}
              value={draft.timeoutMs}
              onChange={(event) => updateDraft('timeoutMs', Number(event.target.value) || 6000)}
            />
          </label>

          <label className="settings-field">
            <span>消息渠道</span>
            <input
              type="text"
              value={draft.messageChannel}
              onChange={(event) => updateDraft('messageChannel', event.target.value)}
              placeholder="可选"
            />
          </label>

          <label className="settings-field">
            <span>账号 ID</span>
            <input
              type="text"
              value={draft.accountId}
              onChange={(event) => updateDraft('accountId', event.target.value)}
              placeholder="可选"
            />
          </label>
        </div>

        <section className="settings-section">
          <div className="settings-section-header">
            <div>
              <h3>预警阈值</h3>
              <p>这些阈值会和 OpenClaw 配置一起保存，不用改代码就能调整。</p>
            </div>
            <span className="settings-inline-hint">已写入配置文件</span>
          </div>

          <div className="settings-form-grid settings-threshold-grid">
            <label className="settings-field">
              <span>默认角色无活动预警（分钟）</span>
              <input
                type="number"
                min={0}
                value={toMinutes(draft.alertThresholds.agentStaleWarningMs)}
                onChange={(event) =>
                  updateThreshold(
                    'agentStaleWarningMs',
                    toMsFromMinutes(Number(event.target.value) || 0),
                  )
                }
              />
            </label>

            <label className="settings-field">
              <span>默认角色无活动严重告警（分钟）</span>
              <input
                type="number"
                min={0}
                value={toMinutes(draft.alertThresholds.agentStaleCriticalMs)}
                onChange={(event) =>
                  updateThreshold(
                    'agentStaleCriticalMs',
                    toMsFromMinutes(Number(event.target.value) || 0),
                  )
                }
              />
            </label>

            <label className="settings-field">
              <span>上下文占用预警（%）</span>
              <input
                type="number"
                min={0}
                max={100}
                value={draft.alertThresholds.tokenWarningPercent}
                onChange={(event) =>
                  updateThreshold('tokenWarningPercent', Number(event.target.value) || 0)
                }
              />
            </label>

            <label className="settings-field">
              <span>上下文占用严重告警（%）</span>
              <input
                type="number"
                min={0}
                max={100}
                value={draft.alertThresholds.tokenCriticalPercent}
                onChange={(event) =>
                  updateThreshold('tokenCriticalPercent', Number(event.target.value) || 0)
                }
              />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-header">
            <div>
              <h3>Mock 模式</h3>
              <p>用于布局演练和交互测试，不会改动已保存的 OpenClaw 地址与密钥。</p>
            </div>
            <button
              type="button"
              className="settings-inline-button"
              onClick={toggleMockMode}
              disabled={mockSwitching}
            >
              {mockSwitching
                ? '切换中...'
                : health?.mockModeEnabled
                  ? '退出 Mock 模式'
                  : '切换到 Mock 模式'}
            </button>
          </div>
          <p className="settings-inline-note">
            {health?.mockModeEnabled
              ? '当前后端正在返回本地 Mock 数据。'
              : '当前仍然使用真实网关或未接入时的空态数据。'}
          </p>
        </section>

        {testResult ? (
          <div className="settings-test-result">
            <span>测试通过</span>
            <strong>{testResult.gatewayUrl}</strong>
            <p>
              请求方：{testResult.requester || '--'} · 智能体数：{testResult.agentCount} · 会话数：
              {testResult.sessionCount} · 连接数：{formatOptionalMetric(testResult.connectionCount)} · 健康渠道：
              {formatOptionalMetric(testResult.healthyChannelCount)}
            </p>
          </div>
        ) : null}

        <div className="settings-footer">
          <div className="settings-footer-copy">
            <span>配置文件</span>
            <strong>{savedConfig?.filePath || '--'}</strong>
          </div>
          <div className="settings-actions">
            <button type="button" className="secondary" onClick={runTest} disabled={testing || saving}>
              {testing ? '测试中...' : '测试连接'}
            </button>
            <button type="button" className="primary" onClick={saveConfig} disabled={saving || testing}>
              {saving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
