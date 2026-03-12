import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  loadOpenClawFileConfig,
  loadOpenClawIntegrationConfig,
  saveOpenClawFileConfig,
} from './openclaw-config.js'

test('save and load preserve allowInsecureTls', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-config-'))
  const filePath = path.join(tempDir, 'openclaw.config.local.json')
  const env = {
    OPENCLAW_CONFIG_FILE: filePath,
  }

  try {
    saveOpenClawFileConfig(
      {
        enabled: true,
        url: 'https://gateway.example.com',
        token: 'secret-token',
        allowInsecureTls: true,
      },
      {
        env,
        preserveExistingToken: false,
      },
    )

    const fileConfig = loadOpenClawFileConfig({ env })
    const integration = loadOpenClawIntegrationConfig({ env })

    assert.equal(fileConfig.config.allowInsecureTls, true)
    assert.equal(integration.allowInsecureTls, true)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
})

test('environment variable can override allowInsecureTls', () => {
  const integration = loadOpenClawIntegrationConfig({
    env: {
      OPENCLAW_URL: 'https://gateway.example.com',
      OPENCLAW_ALLOW_INSECURE_TLS: 'true',
    },
  })

  assert.equal(integration.allowInsecureTls, true)
})
