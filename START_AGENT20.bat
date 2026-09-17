@echo off
setlocal enabledelayedexpansion
title AGENT20 Launcher

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo ===============================================================================
echo                AGENT20 - Academic Research Productivity System
echo ===============================================================================
echo [1/4] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "AGENT20 Backend (FastAPI)" cmd /k "title AGENT20 Backend (FastAPI) && cd /d %SCRIPT_DIR%backend && python -m uvicorn app.main:app --reload --port 8000"

echo [2/4] Waiting for backend to become healthy on port 8000...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ready = $false; for ($i = 0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/health' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { $ready = $true; break } } catch {}; Start-Sleep -Milliseconds 500 }; if (-not $ready) { exit 1 }"

if %ERRORLEVEL% neq 0 (
  echo [ERROR] Backend failed to report healthy on http://127.0.0.1:8000 within 15 seconds.
  echo Check the "AGENT20 Backend (FastAPI)" terminal window for error details.
  pause
  exit /b 1
)
echo       Backend is HEALTHY on port 8000.

echo [3/4] Starting Vite Frontend on http://localhost:5173 ...
start "AGENT20 Frontend (Vite)" cmd /k "title AGENT20 Frontend (Vite) && cd /d %SCRIPT_DIR% && npm --prefix frontend run dev"

echo [4/4] Waiting for frontend to become available on port 5173...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ready = $false; for ($i = 0; $i -lt 30; $i++) { try { $r = Invoke-WebRequest -Uri 'http://localhost:5173' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { $ready = $true; break } } catch {}; Start-Sleep -Milliseconds 500 }; if (-not $ready) { exit 1 }"

if %ERRORLEVEL% neq 0 (
  echo [WARNING] Frontend took longer than expected to respond, but is starting up.
) else (
  echo       Frontend is READY on port 5173.
)

echo.
echo ===============================================================================
echo AGENT20 Application is running!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://127.0.0.1:8000
echo   - API Docs: http://127.0.0.1:8000/docs
echo   - Health:   http://127.0.0.1:8000/health
echo.
echo Opening browser to http://localhost:5173 ...
start http://localhost:5173

echo.
echo To stop all services gracefully, run STOP_AGENT20.bat or press any key below.
echo ===============================================================================
echo Press any key to stop all AGENT20 services...
pause >nul

call "%SCRIPT_DIR%STOP_AGENT20.bat"
