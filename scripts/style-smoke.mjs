import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const server = await createServer({ configFile: false, root: process.cwd(), logLevel: 'error', server: { host: '127.0.0.1', port: 0 }, optimizeDeps: { noDiscovery: true } })
let browser
try {
  await server.listen()
  const url = server.resolvedUrls?.local[0]
  if (!url) throw new Error('Vite did not expose a local style-smoke URL')
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(new URL('/tests/style-smoke.html', url).href)
  await page.waitForFunction(() => document.documentElement.dataset.styleSmokeReady === 'true')
  const actual = await page.evaluate(() => {
    const pick = (element, properties) => Object.fromEntries(properties.map((property) => [property, getComputedStyle(element).getPropertyValue(property)]))
    const shadowProbe = (name, properties) => {
      const host = [...document.querySelectorAll('body > div')].find((element) => element.shadowRoot?.querySelector(`[data-probe="${name}"]`))
      const target = host.shadowRoot.querySelector(`[data-probe="${name}"]`)
      return { host: pick(host, ['font-family', 'line-height']), target: pick(target, properties) }
    }
    return {
      page: {
        body: pick(document.body, ['font-family', 'margin', 'padding']),
        container: pick(document.querySelector('#page'), ['padding', 'max-width', 'min-height']),
        row: pick(document.querySelector('#row'), ['display', 'flex-direction', 'gap']),
        button: pick(document.querySelector('#button'), ['display', 'padding', 'border-radius', 'background-color']),
        popup: pick(document.querySelector('#popup'), ['width', 'background-color', 'color']),
      },
      modal: shadowProbe('modal', ['display', 'flex-direction', 'width', 'height', 'border-radius', 'overflow']),
      suggestions: shadowProbe('suggestions', ['min-width', 'max-width', 'border-radius', 'overflow', 'font-size']),
      deletion: shadowProbe('deletion', ['min-width', 'max-width', 'border-radius']),
    }
  })
  const expected = {
  "page": {
    "body": {
      "font-family": "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial",
      "margin": "0px",
      "padding": "0px"
    },
    "container": {
      "padding": "24px",
      "max-width": "672px",
      "min-height": "800px"
    },
    "row": {
      "display": "flex",
      "flex-direction": "row",
      "gap": "8px"
    },
    "button": {
      "display": "block",
      "padding": "8px 16px",
      "border-radius": "6px",
      "background-color": "rgb(20, 90, 200)"
    },
    "popup": {
      "width": "320px",
      "background-color": "rgb(250, 251, 252)",
      "color": "rgb(20, 21, 22)"
    }
  },
  "modal": {
    "host": {
      "font-family": "\"IBM Plex Condensed Light\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
      "line-height": "24px"
    },
    "target": {
      "display": "flex",
      "flex-direction": "column",
      "width": "600px",
      "height": "560px",
      "border-radius": "8px",
      "overflow": "hidden"
    }
  },
  "suggestions": {
    "host": {
      "font-family": "\"IBM Plex Condensed Light\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
      "line-height": "24px"
    },
    "target": {
      "min-width": "200px",
      "max-width": "360px",
      "border-radius": "8px",
      "overflow": "hidden",
      "font-size": "14px"
    }
  },
  "deletion": {
    "host": {
      "font-family": "\"IBM Plex Condensed Light\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
      "line-height": "24px"
    },
    "target": {
      "min-width": "240px",
      "max-width": "360px",
      "border-radius": "8px"
    }
  }
}
  assert.deepEqual(actual, expected)
  console.log('style smoke passed: page + modal + suggestions + delete confirmation match the frozen pre-U4 baseline')
} finally {
  await browser?.close()
  await server.close()
}
