#!/bin/zsh
set -e
cd "${0:A:h}"
if ! command -v npm >/dev/null 2>&1; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi
if ! command -v npm >/dev/null 2>&1; then
  echo '请先安装 Node.js 20.19+ 或 22.12+，然后重新打开。'
  read -k 1
  exit 1
fi
if [ ! -d node_modules ]; then npm install --no-audit --no-fund; fi
echo '启动后在浏览器打开终端显示的本机地址。按 Ctrl+C 停止。'
npm run dev -- --port 5173
