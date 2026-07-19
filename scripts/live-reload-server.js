#!/usr/bin/env node

import express from 'express';
import path from 'path';
import chokidar from 'chokidar';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const WS_PORT = 3001;

// Create Express app
const app = express();
const server = http.createServer(app);

// Create WebSocket server for live reload
const wss = new WebSocketServer({ port: WS_PORT });

// Serve dev test pages and public assets (test pages live outside public/ so they never ship in dist)
app.use(express.static(path.join(__dirname, '..', 'dev', 'pages')));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Inject live reload script into HTML pages
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const originalSend = res.send;
    res.send = function(data) {
      if (typeof data === 'string' && data.includes('</body>')) {
        const liveReloadScript = `
<script>
  (function() {
    const ws = new WebSocket('ws://localhost:${WS_PORT}');
    ws.onmessage = function(event) {
      if (event.data === 'reload') {
        console.log('[LIVE RELOAD] Extension files changed, reloading...');
        location.reload();
      }
    };
    ws.onopen = function() {
      console.log('[LIVE RELOAD] Connected to live reload server');
    };
    ws.onerror = function() {
      console.log('[LIVE RELOAD] Could not connect to live reload server');
    };
  })();
</script>`;
        data = data.replace('</body>', liveReloadScript + '</body>');
      }
      originalSend.call(this, data);
    };
  }
  next();
});

// Watch for changes in extension files
const watchPaths = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx',
  'src/**/*.css',
  'dist/**/*',
  'public/**/*',
  'dev/pages/**/*'
];

const watcher = chokidar.watch(watchPaths, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true
});

// Broadcast reload message to all connected clients
function broadcastReload() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
}

// Debounce function to avoid too many reloads
let reloadTimeout;
function debouncedReload() {
  clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(() => {
    console.log('📁 Extension files changed, broadcasting reload...');
    broadcastReload();
  }, 300);
}

// Watch for file changes
watcher.on('change', (path) => {
  console.log(`📝 File changed: ${path}`);
  debouncedReload();
});

watcher.on('add', (path) => {
  console.log(`➕ File added: ${path}`);
  debouncedReload();
});

watcher.on('unlink', (path) => {
  console.log(`➖ File removed: ${path}`);
  debouncedReload();
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔌 Client connected to live reload server');
  
  ws.on('close', () => {
    console.log('🔌 Client disconnected from live reload server');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`
🚀 Live Reload Server Started!

📄 Test Page: http://localhost:${PORT}/test.html
🔌 WebSocket:  ws://localhost:${WS_PORT}

👀 Watching for changes in:
${watchPaths.map(p => `   - ${p}`).join('\n')}

💡 The server will automatically reload your test page when extension files change.
   Make sure to also run 'npm run dev' in another terminal for HMR.
`);
});

// Graceful shutdown
function shutdown() {
  console.log('\n🛑 Shutting down live reload server...');
  watcher.close();
  wss.close();
  server.close(() => {
    console.log('✅ Live reload server stopped');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Create PID file for easier process management
import fs from 'fs';
const pidFile = path.join(__dirname, '.live-reload.pid');
fs.writeFileSync(pidFile, process.pid.toString());

// Cleanup PID file on exit
process.on('exit', () => {
  try {
    fs.unlinkSync(pidFile);
  } catch (e) {
    // PID file might not exist, that's ok
  }
});