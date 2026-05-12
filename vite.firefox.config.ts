import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

function firefoxManifestPlugin(): Plugin {
  return {
    name: 'firefox-manifest',
    writeBundle(options) {
      const outDir = options.dir ?? 'dist-firefox';
      const manifest = readFileSync('manifest.firefox.json', 'utf-8');
      writeFileSync(resolve(outDir, 'manifest.json'), manifest);
    },
  };
}

export default defineConfig({
  plugins: [react(), firefoxManifestPlugin()],
  build: {
    outDir: 'dist-firefox',
    rollupOptions: {
      input: {
        // Extension entry points — names must match manifest.firefox.json references
        content: 'src/content/main.ts',
        background: 'src/background/index.ts',
        // UI pages — Vite preserves their directory paths in the output
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        editor: 'src/editor/index.html',
      },
      output: {
        // Keep predictable names for the scripts the manifest references directly
        entryFileNames: (chunk) =>
          ['content', 'background'].includes(chunk.name)
            ? `${chunk.name}.js`
            : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
