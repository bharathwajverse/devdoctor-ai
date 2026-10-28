# ==============================================================================
# devdoctor-ai — Development Launcher
# ==============================================================================

Write-Host "🩺 Launching devdoctor-ai Full Stack Application..." -ForegroundColor Cyan

# 1. Start Backend in separate window
Write-Host "📡 Starting API Server on Port 3001..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..'; npm run dev:backend"

# 2. Start Frontend Vite server in current window
Write-Host "🌐 Starting Vite Frontend on Port 5173..." -ForegroundColor Green
npm run dev
