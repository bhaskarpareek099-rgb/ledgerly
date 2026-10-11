@echo off
title Ledgerly Development Server
echo ========================================================
echo Starting Ledgerly Development Server
echo ========================================================
if exist "%~dp0node-v20.18.0-win-x64" (
    set "PATH=%~dp0node-v20.18.0-win-x64;%PATH%"
)
set "NEXT_TELEMETRY_DISABLED=1"
cd /d "%~dp0"
call npm run dev
pause
