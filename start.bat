@echo off
title Email Builder
color 0A

echo.
echo  ============================================
echo   EMAIL BUILDER - Starting Services
echo  ============================================
echo.

:: ── Check Python ─────────────────────────────────────────────────────────────
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

:: ── Check Node ────────────────────────────────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

:: ── Install backend deps if needed ───────────────────────────────────────────
echo  [1/3] Checking backend dependencies...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo        Installing backend packages...
    pip install fastapi uvicorn pydantic --quiet
)
echo        Backend  OK

:: ── Install frontend deps if needed ──────────────────────────────────────────
echo  [2/3] Checking frontend dependencies...
if not exist "%~dp0frontend\node_modules" (
    echo        Running npm install...
    cd /d "%~dp0frontend"
    npm install --silent
    cd /d "%~dp0"
)
echo        Frontend OK

:: ── Start Backend ─────────────────────────────────────────────────────────────
echo  [3/3] Starting services...
start "Backend" cmd /k "color 0B && cd /d "%~dp0backend" && uvicorn main:app --reload --port 8000"

:: Wait for backend to boot
timeout /t 3 /nobreak >nul

:: ── Start Frontend ────────────────────────────────────────────────────────────
start "Frontend" cmd /k "color 0E && cd /d "%~dp0frontend" && npm run dev"

:: Wait for frontend to boot
timeout /t 4 /nobreak >nul

:: ── Open browser ──────────────────────────────────────────────────────────────
start "" "http://localhost:5173"

:: ── Show status + stop instructions ──────────────────────────────────────────
echo.
echo  ============================================
echo   SERVICES RUNNING
echo  ============================================
echo.
echo   Backend  (FastAPI) : http://localhost:8000
echo   Frontend (Vite)    : http://localhost:5173
echo.
echo  ============================================
echo   TO STOP ALL SERVICES
echo  ============================================
echo.
echo   Press S then ENTER to stop everything
echo.
echo  ============================================
echo.

:WAIT
set /p cmd="  Command (S = Stop): "
if /i "%cmd%"=="S" goto STOP
echo   Unknown command. Press S to stop.
goto WAIT

:STOP
echo.
echo  Stopping services...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 "') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    taskkill /f /pid %%a >nul 2>&1
)
taskkill /fi "windowtitle eq Backend"  /f >nul 2>&1
taskkill /fi "windowtitle eq Frontend" /f >nul 2>&1

echo  Backend  stopped.
echo  Frontend stopped.
echo.
echo  All services stopped. Press any key to exit.
pause >nul
exit
