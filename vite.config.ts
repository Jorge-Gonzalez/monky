import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: 'dist',
    minify: 'esbuild',
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
})
