# Production Build Configuration Examples

## Option 1: PostCSS Configuration (Recommended)

### Install Dependencies
```bash
npm install -D postcss postcss-cli autoprefixer cssnano @fullhuman/postcss-purgecss
```

### postcss.config.js
```javascript
const purgecss = require('@fullhuman/postcss-purgecss');
const cssnano = require('cssnano');

module.exports = {
  plugins: [
    // Add vendor prefixes
    require('autoprefixer'),
    
    // Remove unused CSS (production only)
    process.env.NODE_ENV === 'production' &&
      purgecss({
        content: [
          './src/**/*.html',
          './src/**/*.js',
          './src/**/*.ts',
          './src/**/*.jsx',
          './src/**/*.tsx',
        ],
        
        // Safelist semantic classes that might be added dynamically
        safelist: {
          // Always keep these exact classes
          standard: [
            'horizontal',
            'vertical',
            'rows',
            'grid',
            'blocks',
            'items',
            'sections',
            'is-selected',
            'is-active',
            'shake',
            'pulse',
            'flash',
          ],
          
          // Keep classes matching these patterns
          greedy: [
            /^min-/,        // min-1-col, min-width-200, etc.
            /^max-/,        // max-3-col, max-width-400, etc.
            /^align-/,      // align-start, align-center, etc.
            /^justify-/,    // justify-between, etc.
            /^fill-/,       // fill-container, fill-remaining
            /^fit-/,        // fit-content
            /^wrap-/,       // wrap-allowed, wrap-prevent
            /^scroll-/,     // scroll-y, scroll-x
            /^btn-/,        // btn-primary, btn-secondary, etc.
            /^alert-/,      // alert-error, alert-success, etc.
            /^card/,        // card, card-elevated
            /^modal-/,      // modal-specific classes
          ],
        },
        
        // Don't remove @font-face, @keyframes, etc.
        fontFace: true,
        keyframes: true,
        variables: true,
      }),
    
    // Minify CSS (production only)
    process.env.NODE_ENV === 'production' &&
      cssnano({
        preset: [
          'advanced',
          {
            discardComments: { removeAll: true },
            reduceIdents: false, // Keep semantic names
            mergeRules: true,
            cssDeclarationSorter: true,
          },
        ],
      }),
  ].filter(Boolean),
};
```

### package.json scripts
```json
{
  "scripts": {
    "css:dev": "postcss src/styles/layout.css -o dist/layout.css --watch",
    "css:build": "NODE_ENV=production postcss src/styles/layout.css -o dist/layout.min.css",
    "build": "npm run css:build"
  }
}
```

---

## Option 2: Vite Configuration

### Install Dependencies
```bash
npm install -D vite @vitejs/plugin-vue autoprefixer cssnano @fullhuman/postcss-purgecss
```

### vite.config.js
```javascript
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  css: {
    postcss: './postcss.config.js',
  },
  
  build: {
    // Split CSS for better caching
    cssCodeSplit: true,
    
    // Minification
    minify: 'terser',
    
    rollupOptions: {
      output: {
        // Manual chunks for CSS splitting
        manualChunks: {
          'layout-core': ['./src/styles/layout-core.css'],
          'layout-interactive': ['./src/styles/layout-interactive.css'],
        },
        
        // Consistent naming
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'styles/[name].[hash].css';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [],
  },
});
```

---

## Option 3: Webpack Configuration

### Install Dependencies
```bash
npm install -D webpack webpack-cli css-loader style-loader mini-css-extract-plugin css-minimizer-webpack-plugin purgecss-webpack-plugin
```

### webpack.config.js
```javascript
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { PurgeCSSPlugin } = require('purgecss-webpack-plugin');
const glob = require('glob');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  
  return {
    mode: argv.mode || 'production',
    
    entry: {
      main: './src/index.js',
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
    },
    
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
      ],
    },
    
    plugins: [
      // Extract CSS
      new MiniCssExtractPlugin({
        filename: 'styles/[name].[contenthash].css',
      }),
      
      // Remove unused CSS (production only)
      !isDevelopment &&
        new PurgeCSSPlugin({
          paths: glob.sync('./src/**/*', { nodir: true }),
          safelist: {
            standard: [
              'horizontal',
              'vertical',
              'blocks',
              'items',
              'is-selected',
              'shake',
              'pulse',
            ],
            greedy: [/^min-/, /^max-/, /^align-/, /^justify-/],
          },
        }),
    ].filter(Boolean),
    
    optimization: {
      minimizer: [
        '...',
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'advanced',
              {
                discardComments: { removeAll: true },
                reduceIdents: false,
              },
            ],
          },
        }),
      ],
      
      // Split chunks for better caching
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            type: 'css/mini-extract',
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },
  };
};
```

---

## Option 4: Browser Extension Manifest

### For Chrome/Firefox Extensions

### manifest.json (MV3)
```json
{
  "manifest_version": 3,
  "name": "Your Extension",
  "version": "1.0.0",
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "css": ["styles/layout-core.min.css"],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  
  "web_accessible_resources": [
    {
      "resources": [
        "styles/layout-interactive.min.css",
        "styles/modal.min.css"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### Lazy Loading CSS in Extension
```javascript
// content.js - Load additional CSS only when needed

// Core styles are already loaded via manifest
// Load interactive patterns on-demand

let interactiveStylesLoaded = false;

function loadInteractiveStyles() {
  return new Promise((resolve) => {
    if (interactiveStylesLoaded) {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.id = 'extension-interactive-styles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles/layout-interactive.min.css');
    link.onload = () => {
      interactiveStylesLoaded = true;
      resolve();
    };
    
    document.head.appendChild(link);
  });
}

// Use when opening modal
async function openModal() {
  await loadInteractiveStyles();
  
  // Now create modal with selectable groups, etc.
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  // ...
}
```

---

## Option 5: CSS Modules (Advanced Splitting)

### Split layout.css into modules

```
src/styles/
├── tokens.css              # Variables only (1KB)
├── layout-core.css         # Structure + basic behavior (6KB)
├── layout-grid.css         # Grid patterns (2KB)
├── layout-interactive.css  # Selectable groups, animations (2KB)
├── layout-forms.css        # Form patterns (2KB)
└── layout-responsive.css   # Responsive utilities (1KB)
```

### layout-core.css
```css
/* Import tokens */
@import './tokens.css';

/* Core structure */
.horizontal { ... }
.vertical { ... }
.rows { ... }

/* Core behavior */
.fill-container { ... }
.fit-content { ... }
.tight { ... }
.snug { ... }
.comfortable { ... }

/* Core components */
.btn { ... }
.input { ... }
.card { ... }
```

### layout-interactive.css
```css
/* Selectable groups */
.selectable-group { ... }
.min-selected-1 { ... }
.is-selected { ... }

/* Animations */
@keyframes shake { ... }
@keyframes pulse { ... }
.shake { ... }
.pulse { ... }
```

### Import only what you need
```javascript
// Modal view
import './styles/layout-core.css';
import './styles/layout-interactive.css';

// Settings view
import './styles/layout-core.css';
import './styles/layout-grid.css';
import './styles/layout-forms.css';

// Popup view (minimal)
import './styles/layout-core.css';
```

---

## Build Script Examples

### Simple Build Script (build.js)
```javascript
const fs = require('fs');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

async function buildCSS() {
  // Read source
  const css = fs.readFileSync('./src/styles/layout.css', 'utf8');
  
  // Process
  const result = await postcss([
    autoprefixer,
    cssnano({ preset: 'advanced' }),
  ]).process(css, {
    from: './src/styles/layout.css',
    to: './dist/layout.min.css',
  });
  
  // Write output
  fs.writeFileSync('./dist/layout.min.css', result.css);
  
  if (result.map) {
    fs.writeFileSync('./dist/layout.min.css.map', result.map.toString());
  }
  
  console.log('✓ CSS built successfully');
  console.log(`  Size: ${(result.css.length / 1024).toFixed(2)} KB`);
}

buildCSS().catch(console.error);
```

### Run it
```bash
node build.js
```

---

## Size Verification Script

### check-size.js
```javascript
const fs = require('fs');
const zlib = require('zlib');

function checkSize(filePath) {
  const content = fs.readFileSync(filePath);
  const uncompressed = content.length;
  const gzipped = zlib.gzipSync(content).length;
  const brotli = zlib.brotliCompressSync(content).length;
  
  console.log(`File: ${filePath}`);
  console.log(`  Uncompressed: ${(uncompressed / 1024).toFixed(2)} KB`);
  console.log(`  Gzipped:      ${(gzipped / 1024).toFixed(2)} KB`);
  console.log(`  Brotli:       ${(brotli / 1024).toFixed(2)} KB`);
  console.log(`  Reduction:    ${((1 - brotli / uncompressed) * 100).toFixed(1)}%`);
}

checkSize('./dist/layout.min.css');
```

---

## Recommended Setup for Your Extension

### 1. Development (no optimization)
```bash
# Just use the full layout-refactored.css
# ~14.5 KB uncompressed
# Fast iteration, all patterns available
```

### 2. Production (basic optimization)
```bash
npm install -D postcss postcss-cli autoprefixer cssnano
npm run css:build

# Result: ~11 KB uncompressed, ~3.4 KB gzipped
# Good enough for most extensions
```

### 3. Production (advanced optimization)
```bash
npm install -D @fullhuman/postcss-purgecss

# Add purgecss to postcss.config.js
# Result: ~7-9 KB uncompressed, ~2.5 KB gzipped
# Only if you need every byte
```

### 4. Large Extension (modular loading)
```bash
# Split into modules
# Load core everywhere: ~6 KB gzipped
# Load specialized modules on-demand: ~1-2 KB each
# Best caching, most flexible
```

---

## Performance Monitoring

### Chrome DevTools Coverage
```
1. Open DevTools
2. Cmd+Shift+P (Mac) / Ctrl+Shift+P (Windows)
3. Type "Coverage"
4. Start recording
5. Use your extension
6. Check which CSS classes are used
```

### Lighthouse
```bash
# Test your extension pages
lighthouse https://your-extension-page.html --view
```

---

## Summary: What You Should Do

**For most extensions** (including yours):

1. ✅ Use the full `layout-refactored.css` (~3.4 KB gzipped)
2. ✅ Add basic minification with cssnano
3. ✅ Don't worry about PurgeCSS unless size is critical
4. ✅ Monitor with DevTools if curious

**The system is already optimized!** 🎉

At 3.4 KB gzipped, it's:
- Smaller than 2 average images
- Smaller than most JavaScript libraries
- Cached across all extension views
- Fast to parse and render

Focus on building great features. The performance is already there! 🚀
