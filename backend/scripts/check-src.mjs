import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const srcDir = path.resolve(__dirname, '../src')

function collectJsFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectJsFiles(entryPath)
    }

    return entry.name.endsWith('.js') ? [entryPath] : []
  })
}

const sourceFiles = collectJsFiles(srcDir)

for (const filePath of sourceFiles) {
  const result = spawnSync(process.execPath, ['--check', filePath], {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
