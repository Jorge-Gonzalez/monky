#!/usr/bin/env bash
# Launch Chrome for Testing with the unpacked extension and a CDP port open,
# so chrome-devtools-mcp (or any CDP client) can attach to the real extension pages.
#
# Regular Chrome can't do this any more: since M136 --remote-debugging-port is
# ignored on the default data directory, and since M137 --load-extension is
# ignored entirely on the stable channel. Chrome for Testing still honours both.
#
# Install the browser once with:
#   npx @puppeteer/browsers install chrome@stable --path "$HOME/.cache/chrome-for-testing"
set -euo pipefail

PORT="${MONKY_DEBUG_PORT:-9222}"
PROFILE="${MONKY_DEBUG_PROFILE:-/tmp/monky-debug}"
DIST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/dist"

BROWSER="$(find "$HOME/.cache/chrome-for-testing" -type f -name chrome -path '*chrome-linux64*' 2>/dev/null | sort -V | tail -1)"
if [[ -z "$BROWSER" ]]; then
  echo "Chrome for Testing not found. Install it with:" >&2
  echo '  npx @puppeteer/browsers install chrome@stable --path "$HOME/.cache/chrome-for-testing"' >&2
  exit 1
fi

[[ -f "$DIST/manifest.json" ]] || { echo "No build at $DIST — run 'npm run build' first." >&2; exit 1; }

exec "$BROWSER" \
  --remote-debugging-port="$PORT" \
  --user-data-dir="$PROFILE" \
  --load-extension="$DIST" \
  --disable-extensions-except="$DIST" \
  --no-first-run --no-default-browser-check \
  "$@"
