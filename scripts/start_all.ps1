# ElderTalk Windows 本地启动（Backend + Frontend）
# Linly 须先在另一终端启动，见 docs/deploy/windows-local.md
$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not (Test-Path "$ROOT\.env")) {
  Write-Host "请先: copy .env.example .env 并填写 LLM_API_KEY" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "$ROOT\frontend\.env")) {
  Copy-Item "$ROOT\frontend\.env.example" "$ROOT\frontend\.env"
  Write-Host "已创建 frontend\.env，请确认 VITE_API_BASE=http://localhost:8010" -ForegroundColor Yellow
}

if (-not (Test-Path "$ROOT\frontend\node_modules")) {
  Push-Location "$ROOT\frontend"
  npm install
  Pop-Location
}

Write-Host ""
Write-Host "=== 提醒 ===" -ForegroundColor Cyan
Write-Host "请先在另一终端启动 Linly (port 8000)，见 docs\deploy\windows-local.md"
Write-Host ""

Write-Host "启动 Backend (8010)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\backend'; python -m uvicorn main:app --host 0.0.0.0 --port 8010"

Start-Sleep -Seconds 4

Write-Host "启动 Frontend (5173)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

Start-Sleep -Seconds 5
& "$ROOT\scripts\check_webrtc.ps1"

Write-Host ""
Write-Host "浏览器打开: http://localhost:5173/#/chat" -ForegroundColor Green
