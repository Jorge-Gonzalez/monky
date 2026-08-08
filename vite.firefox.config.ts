import { defineConfig, build } from 'vite'
import preact from '@preact/preset-vite'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'

const OUT_DIR = 'dist-firefox'

/** react → preact. Shared by the page build and by the two classic-script builds below. */
const preactAlias = {
  react: 'preact/compat',
  'react-dom/client': 'preact/compat/client',
  'react-dom': 'preact/compat',
  'react/jsx-runtime': 'preact/jsx-runtime',
  'react/jsx-dev-runtime': 'preact/jsx-runtime',
}

/** Entry points the manifest names directly, and which therefore cannot be ES modules. */
const CLASSIC_ENTRIES = [
  { name: 'content', entry: 'src/content/main.ts' },
  { name: 'background', entry: 'src/background/index.ts' },
]

/**
 * Build the content script and the background as self-contained classic scripts.
 *
 * They cannot be ES modules, and a single Rollup build with code splitting produces exactly that.
 * A content script is injected as a classic script in every browser, so an `import` at the top is a
 * syntax error rather than a resolution problem -- the extension does not partly work, it does not
 * load at all. The background hits the same wall from the other side: Firefox's MV3 background is an
 * event page listed under `scripts`, which is also loaded classically unless the manifest opts into
 * a module, and the previous manifest declared neither.
 *
 * The earlier config emitted both as modules importing from `./assets/*`, so the Firefox build had
 * never been loadable. Chrome's build hid this because CRXJS solves it with a generated loader shim.
 *
 * Two extra builds rather than one, because Rollup emits a single format per build and the HTML
 * pages genuinely want modules and shared chunks. Only these two entries need bundling whole, and
 * their duplication of shared code costs nothing that matters: a content script runs in an isolated
 * world and could never have shared a chunk with a page anyway.
 *
 * Nothing here needs a CSS file. Styles reach the shadow roots as `?raw` strings compiled into the
 * bundle, and font URLs are late-bound through `chrome.runtime.getURL`, so the classic bundles are
 * pure JavaScript with no companion assets to reference.
 */
function classicScriptBundles(mode: string): Plugin {
  return {
    name: 'firefox-classic-script-bundles',
    apply: 'build',
    // After the page build, so `emptyOutDir` there cannot delete what these produce.
    async closeBundle() {
      for (const { name, entry } of CLASSIC_ENTRIES) {
        await build({
          // Neither this plugin nor the manifest writer must run again inside these builds.
          configFile: false,
          mode,
          plugins: [preact()],
          resolve: { alias: preactAlias },
          build: {
            outDir: OUT_DIR,
            emptyOutDir: false,
            lib: {
              entry: resolve(entry),
              name: `monky_${name}`,
              formats: ['iife'],
              fileName: () => `${name}.js`,
            },
          },
        })
      }
    },
  }
}

function firefoxManifestPlugin(): Plugin {
  return {
    name: 'firefox-manifest',
    writeBundle(options) {
      const outDir = options.dir ?? OUT_DIR
      writeFileSync(resolve(outDir, 'manifest.json'), readFileSync('manifest.firefox.json', 'utf-8'))
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [preact(), firefoxManifestPlugin(), classicScriptBundles(mode)],
  resolve: { alias: preactAlias },
  build: {
    outDir: OUT_DIR,
    rollupOptions: {
      // Pages only. The content script and the background are built separately, above.
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        editor: 'src/editor/index.html',
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
}))
