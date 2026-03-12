function isRecord(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeArray(value, warnings, label) {
  if (Array.isArray(value)) {
    return value.filter((entry) => entry != null)
  }

  if (value != null) {
    warnings.push(`${label} should be an array.`)
  }

  return []
}

function normalizeRecord(value, warnings, label) {
  if (isRecord(value)) {
    return value
  }

  if (value != null) {
    warnings.push(`${label} should be an object.`)
  }

  return {}
}

function normalizeOptionalString(value, warnings, label) {
  if (typeof value === 'string') {
    return value
  }

  if (value != null) {
    warnings.push(`${label} should be a string.`)
  }

  return null
}

function normalizeOptionalNumber(value, warnings, label) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (value != null) {
    warnings.push(`${label} should be a finite number.`)
  }

  return null
}

export function createEmptyGatewayMeta() {
  return {
    statusData: null,
    healthData: null,
    presenceData: [],
    errors: [],
    warnings: [],
    methodErrors: {
      status: null,
      health: null,
      systemPresence: null,
    },
    statusAvailable: false,
    healthAvailable: false,
    presenceAvailable: false,
  }
}

export function normalizeGatewaySnapshot(snapshot) {
  const warnings = []
  const sessionsSource = normalizeRecord(snapshot?.sessionsData, warnings, 'sessions_list payload')
  const agentsSource = normalizeRecord(snapshot?.agentsData, warnings, 'agents_list payload')

  return {
    sessionsData: {
      sessions: normalizeArray(sessionsSource.sessions, warnings, 'sessions_list.sessions'),
    },
    agentsData: {
      requester: normalizeOptionalString(agentsSource.requester, warnings, 'agents_list.requester'),
      agents: normalizeArray(agentsSource.agents, warnings, 'agents_list.agents'),
    },
    warnings,
  }
}

function normalizeStatusData(statusData, warnings) {
  if (!isRecord(statusData)) {
    if (statusData != null) {
      warnings.push('status payload should be an object.')
    }

    return null
  }

  const sessions = normalizeRecord(statusData.sessions, warnings, 'status.sessions')
  const heartbeat = normalizeRecord(statusData.heartbeat, warnings, 'status.heartbeat')

  return {
    defaultAgentId: normalizeOptionalString(statusData.defaultAgentId, warnings, 'status.defaultAgentId'),
    agents: normalizeArray(statusData.agents, warnings, 'status.agents'),
    sessions: {
      count: normalizeOptionalNumber(sessions.count, warnings, 'status.sessions.count'),
      recent: normalizeArray(sessions.recent, warnings, 'status.sessions.recent'),
    },
    heartbeat: {
      defaultAgentId: normalizeOptionalString(
        heartbeat.defaultAgentId,
        warnings,
        'status.heartbeat.defaultAgentId',
      ),
      every: normalizeOptionalString(heartbeat.every, warnings, 'status.heartbeat.every'),
      agents: normalizeArray(heartbeat.agents, warnings, 'status.heartbeat.agents'),
    },
  }
}

function normalizeHealthData(healthData, warnings) {
  if (!isRecord(healthData)) {
    if (healthData != null) {
      warnings.push('health payload should be an object.')
    }

    return null
  }

  const channels = normalizeRecord(healthData.channels, warnings, 'health.channels')
  const channelLabels = normalizeRecord(healthData.channelLabels, warnings, 'health.channelLabels')

  return {
    channels,
    channelLabels,
    channelOrder: normalizeArray(healthData.channelOrder, warnings, 'health.channelOrder'),
  }
}

export function normalizeGatewayMeta(meta) {
  const warnings = []
  const rawErrors =
    meta?.errors && typeof meta.errors === 'object' && !Array.isArray(meta.errors)
      ? meta.errors
      : {}
  const methodErrors = {
    status:
      typeof rawErrors.status === 'string' && rawErrors.status.trim() ? rawErrors.status.trim() : null,
    health:
      typeof rawErrors.health === 'string' && rawErrors.health.trim() ? rawErrors.health.trim() : null,
    systemPresence:
      typeof rawErrors.systemPresence === 'string' && rawErrors.systemPresence.trim()
        ? rawErrors.systemPresence.trim()
        : null,
  }
  const statusData = normalizeStatusData(meta?.statusData, warnings)
  const healthData = normalizeHealthData(meta?.healthData, warnings)
  const presenceData = normalizeArray(meta?.presenceData, warnings, 'system-presence payload')
  const errors = Object.values(methodErrors).filter(Boolean)

  return {
    statusData,
    healthData,
    presenceData,
    errors,
    warnings,
    methodErrors,
    statusAvailable: statusData != null && !methodErrors.status,
    healthAvailable: healthData != null && !methodErrors.health,
    presenceAvailable: !methodErrors.systemPresence,
  }
}
