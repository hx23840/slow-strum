#!/bin/zsh
set -e
cd "${0:A:h}"
if ! command -v npm >/dev/null 2>&1; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi
if ! command -v npm >/dev/null 2>&1; then
  echo 'Please install Node.js 20.19+ or 22.12+, then run this launcher again.'
  read -k 1
  exit 1
fi
if [ ! -d node_modules ]; then npm install --no-audit --no-fund; fi
echo 'Open the local address shown below in your browser. Press Ctrl+C to stop.'
npm run dev -- --port 5173
