#!/bin/bash

echo ""
echo " ============================================"
echo "  EMAIL BUILDER - Starting Services"
echo " ============================================"
echo ""

# ── Check Python ──────────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo " [ERROR] Python3 not found. Please install Python 3.8+"
    exit 1
fi

# ── Check Node ────────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo " [ERROR] Node.js not found. Please install Node.js 18+"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Install backend deps if needed ───────────────────────────────────────────
echo " [1/3] Checking backend dependencies..."
if ! python3 -c "import fastapi" &>/dev/null; then
    echo "       Installing backend packages..."
    pip3 install fastapi uvicorn pydantic --quiet
fi
echo "       Backend  OK"

# ── Install frontend deps if needed ──────────────────────────────────────────
echo " [2/3] Checking frontend dependencies..."
if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    echo "       Running npm install..."
    npm install --prefix "$SCRIPT_DIR/frontend" --silent
fi
echo "       Frontend OK"

# ── Start Backend ─────────────────────────────────────────────────────────────
echo " [3/3] Starting services..."
cd "$SCRIPT_DIR/backend"
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "       Backend  PID: $BACKEND_PID"

sleep 2

# ── Start Frontend ────────────────────────────────────────────────────────────
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "       Frontend PID: $FRONTEND_PID"

sleep 3

# ── Open browser ──────────────────────────────────────────────────────────────
xdg-open "http://localhost:5173" &>/dev/null || true

echo ""
echo " ============================================"
echo "  SERVICES RUNNING"
echo " ============================================"
echo ""
echo "  Backend  (FastAPI) : http://localhost:8000"
echo "  Frontend (Vite)    : http://localhost:5173"
echo ""
echo " ============================================"
echo "  Press Ctrl+C or type S + Enter to stop"
echo " ============================================"
echo ""

# ── Wait for stop command ─────────────────────────────────────────────────────
while true; do
    read -r -p "  Command (S = Stop): " cmd
    if [[ "${cmd,,}" == "s" ]]; then
        break
    fi
    echo "  Unknown command. Type S to stop."
done

# ── Stop services ─────────────────────────────────────────────────────────────
echo ""
echo " Stopping services..."
kill $BACKEND_PID  2>/dev/null && echo "  Backend  stopped."
kill $FRONTEND_PID 2>/dev/null && echo "  Frontend stopped."

# Also kill anything still on those ports
fuser -k 8000/tcp &>/dev/null || true
fuser -k 5173/tcp &>/dev/null || true

echo ""
echo " All services stopped."
