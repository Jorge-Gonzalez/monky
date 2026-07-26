import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'Monky - Macro Text Expander',
  version: '0.1.0',
  description: 'Reemplaza macros por texto en inputs y textareas con prefijos configurables.',
  permissions: ['storage', 'alarms', 'tabs'],
  host_permissions: ['http://localhost:5173/*'],
  content_security_policy: {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/main.ts'],
      run_at: 'document_idle'
    }
  ],
  icons: {
    '16': 'icons/monky_icon16.png',
    '32': 'icons/monky_icon32.png',
    '48': 'icons/monky_icon48.png',
    '128': 'icons/monky_icon128.png'
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      '16': 'icons/monky_icon16.png',
      '32': 'icons/monky_icon32.png',
      '48': 'icons/monky_icon48.png',
      '128': 'icons/monky_icon128.png'
    },
    default_title: 'Monky - Macro Text Expander'
  },
  background: {
    service_worker: 'src/background/index.ts'
  },
  options_page: 'src/options/index.html',
  web_accessible_resources: [
    {
      resources: ['src/editor/index.html', 'fonts/ibm-plex-sans-var.woff2'],
      matches: ['<all_urls>']
    }
  ]
})
