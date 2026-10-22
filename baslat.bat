@echo off
title 66 Vizite Platform Sunucusu
chcp 65001 >nul

echo ===================================================
echo       66 Vizite - Sunucu Baslatiliyor
echo ===================================================
echo.

:: 1. Node.js Kontrolu (Onerilen ve Varsayilan)
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js tespit edildi.
    echo.
    echo [1/2] Kutuphaneler kontrol ediliyor...
    if not exist "node_modules" (
        echo [!] Ilk kurulum: npm kutuphaneleri kuruluyor...
        call npm install
    )
    echo [2/2] Sunucu aciliyor: http://localhost:3000
    echo Tarayici baslatiliyor...
    echo.
    echo Sunucuyu durdurmak icin bu pencereyi kapatabilirsiniz.
    echo ===================================================
    start http://localhost:3000
    node server.js
    pause
    exit /b 0
)

:: 2. PHP Geriye Donuk Destek Kontrolu
set PHP_BIN=php
where php >nul 2>&1
if %ERRORLEVEL% EQU 0 goto :START_PHP_SERVER

if exist "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" (
    set "PHP_BIN=C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe"
    goto :START_PHP_SERVER
)

if exist "C:\xampp\php\php.exe" (
    set "PHP_BIN=C:\xampp\php\php.exe"
    goto :START_PHP_SERVER
)

:: 3. Ne Node ne de PHP bulunamazsa
echo [HATA] Sistemde Node.js veya PHP bulunamadi!
echo Lutfen Node.js'i https://nodejs.org adresinden kurunuz.
pause
exit /b 1

:START_PHP_SERVER
echo [OK] PHP tespit edildi: %PHP_BIN%
echo [1/2] PHP Backend baslatiliyor: http://localhost:8000
start http://localhost:8000
"%PHP_BIN%" -S localhost:8000 router.php
pause
