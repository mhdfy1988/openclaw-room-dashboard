import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distIndexPath = path.resolve(rootDir, 'frontend/dist/index.html')
const screenshotDir = path.resolve(rootDir, 'docs/screenshots')
const host = '127.0.0.1'
const port = 4421
const baseUrl = `http://${host}:${port}`

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServerReady(url, timeoutMs = 20_000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // Keep polling until ready.
    }

    await delay(300)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

async function stopServer(server) {
  if (!server || server.killed) {
    return
  }

  server.kill()

  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    delay(5_000),
  ])
}

if (!existsSync(distIndexPath)) {
  throw new Error('frontend/dist is missing. Run `npm run build` before capturing screenshots.')
}

mkdirSync(screenshotDir, { recursive: true })

const overviewPath = path.join(screenshotDir, 'overview-v0.1.0.png')
const detailPath = path.join(screenshotDir, 'agent-detail-v0.1.0.png')

let server
let browser

try {
  server = spawn(process.execPath, ['backend/src/prod-server.js'], {
    cwd: rootDir,
    env: {
      ...process.env,
      HOST: host,
      PORT: String(port),
      OPENCLAW_ENABLED: 'false',
      ROOM_DASHBOARD_USE_MOCK: 'true',
    },
    stdio: 'pipe',
  })

  server.stderr.on('data', (chunk) => {
    process.stderr.write(chunk)
  })

  await waitForServerReady(`${baseUrl}/api/health`)

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: {
      width: 1600,
      height: 1200,
    },
  })

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await page.locator('.topbar').waitFor()
  await page.screenshot({
    path: overviewPath,
    fullPage: true,
  })

  const agentButtons = page.locator('.agent-avatar-card')
  await agentButtons.first().waitFor()
  await agentButtons.first().click()
  await page.locator('.clear-selection-button').waitFor()
  await page.screenshot({
    path: detailPath,
    fullPage: true,
  })

  process.stdout.write(`Wrote ${overviewPath}\n`)
  process.stdout.write(`Wrote ${detailPath}\n`)
} catch (error) {
  if (String(error?.message || error).includes("Executable doesn't exist")) {
    throw new Error(
      'Playwright Chromium is not installed. Run `npx playwright install chromium` and try again.',
    )
  }

  throw error
} finally {
  if (browser) {
    await browser.close()
  }

  await stopServer(server)
}
