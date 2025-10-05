#!/bin/bash

echo "🛑 Stopping development servers..."

# Function to kill process by PID file
kill_by_pidfile() {
  local pidfile=$1
  local name=$2
  
  if [ -f "$pidfile" ]; then
    local pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      echo "  Stopping $name (PID: $pid)..."
      kill "$pid"
      rm -f "$pidfile"
    else
      echo "  $name PID file exists but process is not running"
      rm -f "$pidfile"
    fi
  fi
}

# Kill live reload server by PID file
kill_by_pidfile ".live-reload.pid" "Live Reload Server"

# Kill vite/npm processes
echo "  Stopping Vite and npm processes..."
pkill -f "vite dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "live-reload-server.js" 2>/dev/null || true

# Kill processes on specific ports
echo "  Killing processes on ports 5173 and 3001..."
lsof -ti:5173,3001 2>/dev/null | xargs -r kill -9 2>/dev/null || true

echo "✅ All development servers stopped"