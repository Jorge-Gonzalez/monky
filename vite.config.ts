import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        editor: resolve(__dirname, 'src/editor/index.html')
      },
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      }
    },
    minify: 'esbuild'
  },
  server: {
    port: 3000, // Try a different port like 3000
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Add this line to your config
    setupFiles: './vitest.setup.ts',
  },
})
