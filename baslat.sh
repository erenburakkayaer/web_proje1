#!/usr/bin/env bash
# 66 Vizite Yerel Başlatıcı (macOS / Linux)
cd "$(dirname "$0")"

PORT=${PORT:-3000}

echo "==================================================="
echo "   66 Vizite - Yerel Sunucu Başlatılıyor"
echo "==================================================="
echo "Adres: http://localhost:$PORT"
echo ""

# Tarayıcıda aç
if which open >/dev/null 2>&1; then
  sleep 1 && open "http://localhost:$PORT" &
fi

node server.js
