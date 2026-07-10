import { createReadStream, existsSync, statSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, relative } from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')
const DIST = join(ROOT, 'dist')
const REPORT = join(ROOT, 'reports/style-coverage.json')

// Public style contracts that must remain even when production source does not
// currently instantiate them. Keep this list small and evidence-backed.
const CONTRACT_CLASSES = new Map([
  // ['class-name', 'reason'],
])

const MIME = new Map([
  ['.html', 'text/html'],
  ['.js', 'text/javascript'],
  ['.css', 'text/css'],
  ['.json', 'application/json'],
  ['.png', 'image/png'],
  ['.woff2', 'font/woff2'],
])

async function walk(dir, out = []) {
  for (const name of await readdir(dir)) {
    const file = join(dir, name)
    const stat = statSync(file)
    if (stat.isDirectory()) await walk(file, out)
    else out.push(file)
  }
  return out
}

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '')
}

function cssClasses(selectorSource) {
  const classes = []
  for (let index = 0; index < selectorSource.length; index += 1) {
    if (selectorSource[index] !== '.') continue
    const previous = selectorSource[index - 1]
    if (previous && /[A-Za-z0-9_-]/.test(previous)) continue
    let cursor = index + 1
    let name = ''
    while (cursor < selectorSource.length) {
      const char = selectorSource[cursor]
      if (char === '\\' && cursor + 1 < selectorSource.length) {
        name += selectorSource[cursor + 1]
        cursor += 2
        continue
      }
      if (/[A-Za-z0-9_-]/.test(char)) {
        name += char
        cursor += 1
        continue
      }
      break
    }
    if (name && !/^\d/.test(name)) classes.push(name)
  }
  return classes
}

function declarationCount(body) {
  return body
    .split(';')
    .map((part) => part.trim())
    .filter((part) => /^-{0,2}[A-Za-z_][A-Za-z0-9_-]*\s*:/.test(part))
    .length
}

function wordTokens(source) {
  return new Set([...source.matchAll(/[A-Za-z_][A-Za-z0-9_-]*(?::[A-Za-z0-9_-]+)?/g)].map((match) => match[0]))
}

async function collectCssDefinitions() {
  const cssFiles = (await walk(SRC)).filter((file) => file.endsWith('.css'))
  const classes = new Map()
  const selectorBlocks = []

  for (const file of cssFiles) {
    const source = stripCssComments(await readFile(file, 'utf8'))
    const rel = relative(ROOT, file)
    for (const match of source.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)) {
      const selector = match[1].trim().replace(/\s+/g, ' ')
      const body = match[2]
      const selectorClasses = [...new Set(cssClasses(selector))]
      if (!selectorClasses.length) continue
      const declarations = declarationCount(body)
      selectorBlocks.push({ file: rel, selector, classes: selectorClasses, declarations })
      for (const className of selectorClasses) {
        const record = classes.get(className) ?? { className, files: new Set(), selectors: [], declarations: 0 }
        record.files.add(rel)
        record.selectors.push(selector)
        record.declarations += declarations
        classes.set(className, record)
      }
    }
  }

  return {
    classes: [...classes.values()].map((record) => ({
      ...record,
      files: [...record.files].sort(),
      selectors: [...new Set(record.selectors)].sort(),
    })).sort((left, right) => left.className.localeCompare(right.className)),
    selectorBlocks,
  }
}

async function tokenSet(files) {
  const out = new Set()
  for (const file of files) {
    if (!existsSync(file)) continue
    for (const token of wordTokens(await readFile(file, 'utf8'))) out.add(token)
  }
  return out
}

async function collectStaticReferences() {
  const srcFiles = await walk(SRC)
  const production = srcFiles.filter((file) => /\.(ts|tsx|html)$/.test(file) && !/\.test\./.test(file))
  const tests = srcFiles.filter((file) => /\.test\.(ts|tsx)$/.test(file))
  const { builtAppFiles, builtExampleFiles } = await builtReferenceFiles()
  return {
    production: await tokenSet(production),
    tests: await tokenSet(tests),
    builtApp: await tokenSet(builtAppFiles),
    builtExample: await tokenSet(builtExampleFiles),
  }
}

async function builtReferenceFiles() {
  if (!existsSync(DIST)) return { builtAppFiles: [], builtExampleFiles: [] }
  const manifestPath = join(DIST, '.vite/manifest.json')
  if (!existsSync(manifestPath)) {
    const distFiles = (await walk(DIST)).filter((file) => /\.(js|html)$/.test(file))
    return { builtAppFiles: distFiles, builtExampleFiles: [] }
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const addEntryGraph = (entry, out) => {
    if (!entry) return
    if (entry.file) out.add(join(DIST, entry.file))
    for (const importKey of entry.imports ?? []) addEntryGraph(manifest[importKey], out)
    for (const dynamicKey of entry.dynamicImports ?? []) addEntryGraph(manifest[dynamicKey], out)
  }
  const app = new Set()
  const examples = new Set()
  for (const [key, entry] of Object.entries(manifest)) {
    if (!entry?.isEntry) continue
    if (key.startsWith('examples/')) addEntryGraph(entry, examples)
    else addEntryGraph(entry, app)
  }
  for (const file of await walk(join(DIST, 'src')).catch(() => [])) {
    if (/\.(html|js)$/.test(file)) app.add(file)
  }
  const manifestJson = join(DIST, 'manifest.json')
  if (existsSync(manifestJson)) app.add(manifestJson)
  return {
    builtAppFiles: [...app].filter((file) => /\.(js|html|json)$/.test(file)),
    builtExampleFiles: [...examples].filter((file) => /\.(js|html|json)$/.test(file) && !app.has(file)),
  }
}

function serveDist() {
  const server = createServer((request, response) => {
    let pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
    if (pathname === '/') pathname = '/src/popup/index.html'
    const file = normalize(join(DIST, pathname))
    if (!file.startsWith(DIST)) {
      response.statusCode = 403
      response.end()
      return
    }
    try {
      const stat = statSync(file)
      if (stat.isDirectory()) throw new Error('directory')
      response.setHeader('content-type', MIME.get(extname(file)) ?? 'application/octet-stream')
      createReadStream(file).pipe(response)
    } catch {
      response.statusCode = 404
      response.end('not found')
    }
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

async function collectRuntimeCoverage() {
  if (!existsSync(DIST)) return { observedClasses: new Set(), cssCoverage: [], error: 'dist missing; run npm run build first' }
  const server = await serveDist()
  const port = server.address().port
  const browser = await chromium.launch({ headless: true })
  const observedClasses = new Set()
  const cssCoverage = []
  const pages = ['/src/popup/index.html', '/src/options/index.html', '/src/editor/index.html']

  try {
    for (const pathname of pages) {
      const page = await browser.newPage()
      await page.coverage.startCSSCoverage({ resetOnNavigation: false })
      await page.goto(`http://127.0.0.1:${port}${pathname}`, { waitUntil: 'networkidle' }).catch(() => {})
      await page.waitForTimeout(500)
      const observed = await page.evaluate(() => {
        const out = new Set()
        const visitRoot = (root) => {
          for (const element of root.querySelectorAll('*')) {
            for (const className of element.classList) out.add(className)
            if (element.shadowRoot) visitRoot(element.shadowRoot)
          }
        }
        visitRoot(document)
        return [...out]
      })
      for (const className of observed) observedClasses.add(className)
      const coverage = await page.coverage.stopCSSCoverage()
      for (const entry of coverage) {
        const totalBytes = entry.text.length
        const usedBytes = entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0)
        cssCoverage.push({
          page: pathname,
          asset: entry.url.replace(`http://127.0.0.1:${port}/`, ''),
          usedBytes,
          totalBytes,
          usedPercent: Number(((usedBytes / totalBytes) * 100).toFixed(1)),
        })
      }
      await page.close()
    }
  } finally {
    await browser.close()
    server.close()
  }

  return { observedClasses, cssCoverage }
}

function classify(record, refs, runtime) {
  const className = record.className
  const livenessEvidence = []
  const supportingEvidence = []
  if (refs.production.has(className)) livenessEvidence.push('production-source')
  if (runtime.observedClasses.has(className)) livenessEvidence.push('runtime-observed')
  if (refs.tests.has(className)) livenessEvidence.push('test-reference')
  if (CONTRACT_CLASSES.has(className)) livenessEvidence.push(`contract: ${CONTRACT_CLASSES.get(className)}`)

  // Bundled JS/HTML may contain raw CSS text. That proves the selector is shipped,
  // not that production markup applies it, so keep it out of liveness decisions.
  if (refs.builtApp.has(className)) supportingEvidence.push('bundled-app-token')
  if (refs.builtExample.has(className)) supportingEvidence.push('bundled-example-token')

  let disposition = 'dead-candidate'
  if (CONTRACT_CLASSES.has(className)) disposition = 'live-contract'
  else if (refs.production.has(className)) disposition = 'live-static'
  else if (runtime.observedClasses.has(className)) disposition = 'live-runtime'
  else if (refs.tests.has(className)) disposition = 'test-only'

  return { ...record, disposition, livenessEvidence, supportingEvidence }
}

async function main() {
  const css = await collectCssDefinitions()
  const refs = await collectStaticReferences()
  const runtime = await collectRuntimeCoverage()
  const classes = css.classes.map((record) => classify(record, refs, runtime))
  const byDisposition = classes.reduce((acc, record) => {
    acc[record.disposition] = (acc[record.disposition] ?? 0) + 1
    return acc
  }, {})
  const deadDeclarations = classes
    .filter((record) => record.disposition === 'dead-candidate')
    .reduce((sum, record) => sum + record.declarations, 0)

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      definedClasses: classes.length,
      selectorBlocks: css.selectorBlocks.length,
      byDisposition,
      deadCandidateDeclarations: deadDeclarations,
      runtimePages: runtime.cssCoverage ? [...new Set(runtime.cssCoverage.map((entry) => entry.page))] : [],
    },
    cssCoverage: runtime.cssCoverage ?? [],
    classes,
  }

  await mkdir(join(ROOT, 'reports'), { recursive: true })
  await writeFile(REPORT, `${JSON.stringify(report, null, 2)}\n`)

  console.log(`style coverage audit wrote ${relative(ROOT, REPORT)}`)
  console.log(JSON.stringify(report.summary, null, 2))
  const dead = classes.filter((record) => record.disposition === 'dead-candidate')
  if (dead.length) {
    console.log('\nDead candidates:')
    for (const record of dead) {
      console.log(`- ${record.className} (${record.declarations} declarations) — ${record.files.join(', ')}`)
    }
  }
}

await main()
