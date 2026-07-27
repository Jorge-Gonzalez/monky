import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const rootIndex = args.indexOf('--ermine-root')
const ermineRoot = rootIndex >= 0 && args[rootIndex + 1] ? resolve(args[rootIndex + 1]) : undefined
if (!ermineRoot || !existsSync(resolve(ermineRoot, 'adoption/current-ledger.ts'))) {
  throw new Error('usage: reconcile-styles.mjs --ermine-root <path>')
}
const project = relative(ermineRoot, projectRoot)
// Bare run rewrites the ledger, --check only gates, matching Ermine's own spec/spec:check
// pair. The closure gate is asserted either way.
const check = args.includes('--check')
const result = spawnSync(process.execPath, [
  '--import',
  'tsx',
  'adoption/current-ledger.ts',
  '--project',
  project,
  '--name',
  'monky',
  check ? '--check' : '--write',
  '--gate',
], { cwd: ermineRoot, stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
