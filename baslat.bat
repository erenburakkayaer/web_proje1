@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===================================================
echo    66 Vizite - PHP Backend Sunucusu Baslatiliyor
echo    Adres: http://localhost:3000
echo ===================================================
start http://localhost:3000
php -S localhost:3000 router.php
pause
