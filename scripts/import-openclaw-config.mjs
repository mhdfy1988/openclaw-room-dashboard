import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const rootDir = process.cwd()
const sourcePath = path.join(os.homedir(), '.openclaw', 'openclaw.json')
const targetPath = path.join(rootDir, 'backend', 'openclaw.config.local.json')
const force = process.argv.includes('--force')

if (!fs.existsSync(sourcePath)) {
  console.error(`OpenClaw config not found: ${sourcePath}`)
  process.exit(1)
}

if (fs.existsSync(targetPath) && !force) {
  console.error(`Target already exists: ${targetPath}`)
  console.error('Re-run with --force if you want to overwrite it.')
  process.exit(1)
}

const raw = fs.readFileSync(sourcePath, 'utf8')
const sourceConfig = JSON.parse(raw)
const gateway = sourceConfig?.gateway ?? {}
const auth = gateway?.auth ?? {}

const output = {
  enabled: true,
  url: `http://127.0.0.1:${gateway.port || 18789}`,
  token: typeof auth.token === 'string' ? auth.token : '',
  sessionKey: 'main',
  timeoutMs: 6000,
  messageChannel: '',
  accountId: '',
}

fs.writeFileSync(targetPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(`Wrote ${targetPath}`)
