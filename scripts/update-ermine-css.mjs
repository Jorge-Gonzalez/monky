import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const rootIndex = args.indexOf('--ermine-root')
const ermineRoot = rootIndex >= 0 && args[rootIndex + 1] ? resolve(args[rootIndex + 1]) : undefined
const check = args.includes('--check')
if (!ermineRoot || !existsSync(resolve(ermineRoot, 'adoption/build-css.ts'))) {
  throw new Error('usage: update-ermine-css.mjs --ermine-root <path> [--check]')
}
const manifest = relative(ermineRoot, resolve(projectRoot, 'ermine.elements.json'))
const output = relative(ermineRoot, resolve(projectRoot, 'src/styles/grammar/ermine.generated.css'))
const compilerArgs = ['--import', 'tsx', 'adoption/build-css.ts', '--manifest', manifest, '--out', output]
if (check) compilerArgs.push('--check')
const result = spawnSync(process.execPath, compilerArgs, { cwd: ermineRoot, stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)
