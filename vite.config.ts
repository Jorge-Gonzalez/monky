import { defineConfig, type ConfigEnv, type UserConfig } from 'vite'
import preact from '@preact/preset-vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'
import devtoolsJson from 'vite-plugin-devtools-json';

function isProdBuild(mode: string) {
  return mode === 'production' || mode === 'production-terser'
}

// Chrome extension pages block scripts/links with crossorigin attribute
const removeCrossorigin = {
  name: 'remove-crossorigin',
  transformIndexHtml: (html: string) => html.replace(/ crossorigin/g, ''),
}

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {

  const prod = isProdBuild(mode)
  const isTerser = mode === 'production-terser'
  
  return {
    plugins: [
      preact({ prefreshEnabled: false }),
      removeCrossorigin,
      crx({ manifest }),
      ...(process.env.NODE_ENV !== 'production' ? [devtoolsJson()] : []),
    ],
    build: {
      outDir: 'dist',
      minify: isTerser ? 'terser' : 'esbuild',
      // Enable CSS minification (Vite uses Lightning CSS by default)
      cssMinify: true,
      terserOptions: isTerser
        ? {
          compress: {
            drop_console: true,
            drop_debugger: true,
            // Optimize string concatenation and template literals
            unsafe_methods: true,
            passes: 2, // Run compression twice for better results
          },
          format: {
            // Remove comments from output
            comments: false,
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
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom/client': 'preact/compat/client',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
        'react/jsx-dev-runtime': 'preact/jsx-runtime',
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
      setupFiles: './vitest.setup.ts',
      deps: {
        interopDefault: true,
      },
      server: {
        deps: {
          inline: ['zustand', 'use-sync-external-store'],
        },
      },
    },
  }
})
