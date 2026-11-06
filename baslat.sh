#!/usr/bin/env bash
# 66 Vizite - PHP Yerel Sunucu Başlatıcı
cd "$(dirname "$0")"

PORT=${PORT:-3000}

if command -v php >/dev/null 2>&1; then
  PHP_BIN="php"
elif [ -x "/Applications/Local.app/Contents/Resources/extraResources/lightning-services/php-8.2.29+0/bin/darwin-arm64/bin/php" ]; then
  PHP_BIN="/Applications/Local.app/Contents/Resources/extraResources/lightning-services/php-8.2.29+0/bin/darwin-arm64/bin/php"
else
  echo "Hata: PHP bulunamadı."
  exit 1
fi

echo "==================================================="
echo "   66 Vizite - PHP Backend Sunucusu Başlatıldı"
echo "   Adres: http://localhost:$PORT"
echo "==================================================="

"$PHP_BIN" -S "localhost:$PORT" router.php
