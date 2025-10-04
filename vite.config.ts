import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: 'dist',
    minify: 'esbuild',
  },
  server: {
    port: 3000, // Try a different port like 3000
    host: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
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
})
