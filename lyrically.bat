@echo off
setlocal

:: === CONFIGURABLE VARIABLES ===
set REPO_URL=https://github.com/yashsrivasta7a/Lyrically.git
set CLONE_DIR=C:\Code\Lyrically
set BACKEND_DIR=C:\Code\Lyrically\Backend
set SERVER_JS=server.js

:: === Create base clone directory if it doesn't exist ===
if not exist "C:\Code" (
    mkdir C:\Code
)

:: === Clone your GitHub repo ===
cd /d C:\Code
echo Cloning your repo...
git clone %REPO_URL%

:: === Move into Backend ===
cd /d "%BACKEND_DIR%"

:: === Install NPM packages ===
echo Installing dependencies...
npm install

:: === Start server temporarily ===
echo Starting Node.js server temporarily...
start cmd /k "node %SERVER_JS%"

:: === Run PowerShell script as ADMIN ===
echo Setting up PM2 and Scheduled Task...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process PowerShell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%BACKEND_DIR%\setup-pm2.ps1\"'"

echo.
echo ✅ All done!
pause
endlocal
