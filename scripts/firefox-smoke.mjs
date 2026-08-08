// Runs the built Firefox pages in Gecko and asserts they render.
//
// What this covers, and what it deliberately does not:
//
// The unit suite runs in jsdom, which is not a browser engine -- it has no layout, no real CSS
// cascade, and its own JavaScript is Node's. The Chrome build is exercised by hand in Blink. Nothing
// had ever evaluated the Firefox artifact in Gecko, and that artifact is produced by a different
// Rollup configuration under a different manifest. This closes that gap: the pages are served from
// the build directory and opened in Playwright's Firefox, and a page that fails to parse, fails to
// render, or throws on the way up is a failure here.
//
// It does not load the extension. Playwright cannot drive `moz-extension://` pages -- its Firefox
// protocol throws `JSWindowActorChild cannot send at the moment` on that origin -- and that holds
// however the add-on is installed, so no arrangement of this script could reach one. Installing into
// a real Firefox and exercising the storage APIs is a separate check, run through web-ext, and its
// findings are recorded in docs/storage-design.md.
//
// So `chrome` is stubbed here, and the stub is deliberately thin: enough for the pages to hydrate,
// no more. It is not pretending to be the browser -- the question being asked is whether this
// JavaScript and this CSS survive contact with Gecko, not whether the storage layer is correct.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { firefox } from 'playwright'

const BUILD = 'dist-firefox'
const PAGES = {
  popup: '/src/popup/index.html',
  options: '/src/options/index.html',
  editor: '/src/editor/index.html',
}
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.json': 'application/json',
}

if (!existsSync(BUILD)) throw new Error(`${BUILD} is missing -- run "pnpm build:firefox" first`)

// The built pages reference /assets/... absolutely, so the build directory has to be the root.
const server = createServer((request, response) => {
  const path = join(BUILD, normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname)))
  readFile(path).then(
    (body) => {
      response.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' })
      response.end(body)
    },
    () => {
      response.writeHead(404)
      response.end()
    }
  )
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const origin = `http://127.0.0.1:${server.address().port}`

// Promise-based, because that is what the pages await and what Firefox gives them under MV3.
const CHROME_STUB = () => {
  const areas = { local: new Map(), sync: new Map(), session: new Map() }
  const area = (store) => ({
    get: (keys) => {
      if (keys === null || keys === undefined) return Promise.resolve(Object.fromEntries(store))
      const wanted = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys)
      const out = {}
      for (const key of wanted) if (store.has(key)) out[key] = store.get(key)
      return Promise.resolve(out)
    },
    set: (items) => {
      for (const [key, value] of Object.entries(items)) store.set(key, value)
      return Promise.resolve()
    },
    remove: (keys) => {
      for (const key of [].concat(keys)) store.delete(key)
      return Promise.resolve()
    },
    clear: () => {
      store.clear()
      return Promise.resolve()
    },
    getBytesInUse: () => Promise.resolve(0),
  })
  globalThis.chrome = {
    storage: {
      local: area(areas.local),
      sync: area(areas.sync),
      session: area(areas.session),
      onChanged: { addListener() {}, removeListener() {} },
    },
    runtime: {
      id: 'monky-smoke',
      getURL: (path) => `${location.origin}/${String(path).replace(/^\//, '')}`,
      sendMessage: () => Promise.resolve(),
      onMessage: { addListener() {}, removeListener() {} },
      lastError: undefined,
    },
    tabs: { create: () => Promise.resolve(), query: () => Promise.resolve([]), reload: () => Promise.resolve() },
    alarms: { create: () => Promise.resolve(), onAlarm: { addListener() {} } },
  }
}

const failures = []
const check = (name, fn) => {
  try {
    fn()
  } catch (error) {
    failures.push(`${name} -- ${error.message.split('\n')[0]}`)
  }
}

const browser = await firefox.launch({ headless: true })
try {
  for (const [name, path] of Object.entries(PAGES)) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
    const errors = []
    page.on('pageerror', (error) => errors.push(String(error)))
    await page.addInitScript(CHROME_STUB)
    await page.goto(origin + path, { waitUntil: 'load' })
    // Preact renders after the module graph evaluates, so wait for the result, not for a duration.
    await page
      .waitForFunction(() => document.body.innerText.trim().length > 0, { timeout: 15_000 })
      .catch(() => undefined)

    const state = await page.evaluate(() => {
      const body = getComputedStyle(document.body)
      return {
        children: document.body.childElementCount,
        text: document.body.innerText.trim().length,
        // Rendered means laid out, not merely present: a mounted tree with zero height is the
        // failure a DOM-only assertion misses, and only a real engine can tell the difference.
        painted: [...document.body.querySelectorAll('*')].filter((el) => el.getBoundingClientRect().height > 0).length,
        fontFamily: body.fontFamily,
      }
    })

    check(`${name}: mounts a tree`, () => assert.ok(state.children > 0, 'body has no child elements'))
    check(`${name}: renders text`, () => assert.ok(state.text > 0, 'body rendered no text'))
    check(`${name}: lays out`, () => assert.ok(state.painted > 3, `only ${state.painted} element(s) had height`))
    check(`${name}: applies its font`, () => assert.match(state.fontFamily, /Plex|sans/i))
    check(`${name}: throws nothing`, () => assert.deepEqual(errors, []))

    console.log(
      `  ${name.padEnd(7)} ${String(state.children).padStart(2)} root child(ren), ` +
        `${String(state.painted).padStart(3)} laid out, ${state.text} chars, ${errors.length} error(s)`
    )
    for (const error of errors) console.log(`      ${error.split('\n')[0]}`)
    await page.close()
  }
} finally {
  await browser.close()
  server.close()
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s) in Gecko:`)
  for (const failure of failures) console.error(`  x ${failure}`)
  process.exit(1)
}
console.log('\nThe Firefox pages render in Gecko.')
