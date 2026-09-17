@echo off
setlocal
echo ===============================================================================
echo Stopping AGENT20 services...
echo ===============================================================================

echo Stopping backend processes on port 8000...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo Stopping frontend processes on port 5173...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo Closing AGENT20 terminal windows...
taskkill /FI "WINDOWTITLE eq AGENT20 Backend (FastAPI)*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AGENT20 Frontend (Vite)*" /F >nul 2>&1

echo.
echo AGENT20 services stopped cleanly.
