#!/usr/bin/env bash
# 66 Vizite Yerel Başlatıcı (macOS / Linux)
cd "$(dirname "$0")"

PORT=${PORT:-3000}

echo "==================================================="
echo "   66 Vizite - Yerel Sunucu Başlatılıyor"
echo "==================================================="
echo "Adres: http://localhost:$PORT"
echo ""

if [ ! -d "node_modules" ]; then
  echo "İlk kurulum: Bağımlılıklar yükleniyor..."
  npm install
fi

# Tarayıcıda aç
if which open >/dev/null 2>&1; then
  sleep 1 && open "http://localhost:$PORT" &
elif which xdg-open >/dev/null 2>&1; then
  sleep 1 && xdg-open "http://localhost:$PORT" &
fi

node server.js
