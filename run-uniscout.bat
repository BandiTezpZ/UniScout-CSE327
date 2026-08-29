@echo off
setlocal
title UniScout Launcher

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if not exist "%BACKEND%\package.json" (
  echo Backend package.json was not found at:
  echo %BACKEND%
  pause
  exit /b 1
)

if not exist "%FRONTEND%\package.json" (
  echo Frontend package.json was not found at:
  echo %FRONTEND%
  pause
  exit /b 1
)

if not exist "%BACKEND%\.env" (
  if exist "%BACKEND%\.env.example" (
    copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
    echo Created backend\.env from backend\.env.example
  )
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm were not found in PATH.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

echo Starting UniScout backend and frontend...
echo.
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:5173
echo.
echo Keep both opened terminal windows running while using the app.
echo.

echo Stopping any old UniScout processes on ports 5001 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5001 .*LISTENING"') do taskkill /F /PID %%a >nul 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":5173 .*LISTENING"') do taskkill /F /PID %%a >nul 2>nul

start "UniScout Backend" /D "%BACKEND%" cmd.exe /k "title UniScout Backend && npm.cmd start"
start "UniScout Frontend" /D "%FRONTEND%" cmd.exe /k "title UniScout Frontend && npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort"

ping 127.0.0.1 -n 4 >nul
start "" "http://localhost:5173"

endlocal
