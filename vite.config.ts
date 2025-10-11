import { defineConfig, type ConfigEnv, type UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'
import type { TerserOptions } from 'terser'

function isProdBuild(mode: string) {
  return mode === 'production' || mode === 'production-terser'
}

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {

  const prod = isProdBuild(mode)
  const isTerser = mode === 'production-terser'
  
  return {
    plugins: [react(), crx({ manifest })],
    build: {
      outDir: 'dist',
      minify: isTerser ? 'terser' : 'esbuild',
      terserOptions: isTerser
        ? {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        }
        : undefined,
      rollupOptions: {
        input: {
          // Add explicit entry points for all HTML pages
          popup: 'src/popup/index.html',
          options: 'src/options/index.html',
          editor: 'src/editor/index.html',
        },
      },
    },
    server: {
      port: 5173, // Try a different port like 3000
      host: true,
      strictPort: true,
      hmr: {
        host: 'localhost',
        protocol: 'ws',
        clientPort: 5173,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      // Add this line to your config
      setupFiles: './vitest.setup.ts',
      deps: {
        interopDefault: true,
      },
    },
  }
})
