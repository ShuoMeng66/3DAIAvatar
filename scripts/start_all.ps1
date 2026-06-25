# ElderTalk 全栈启动 (Windows)
$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

if (-not (Test-Path "$ROOT\.env")) {
  Write-Host "请先 cp .env.example .env" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path "$ROOT\frontend\node_modules")) {
  Push-Location "$ROOT\frontend"
  npm install
  Pop-Location
}

Write-Host "启动 Backend..."
Start-Job -ScriptBlock {
  Set-Location $using:ROOT\backend
  python -m uvicorn main:app --host 0.0.0.0 --port 8010
} | Out-Null

Start-Sleep -Seconds 4

Write-Host "启动 Frontend..."
Start-Job -ScriptBlock {
  Set-Location $using:ROOT\frontend
  npm run dev -- --host 0.0.0.0
} | Out-Null

Start-Sleep -Seconds 3
& "$ROOT\scripts\check_webrtc.ps1"

Write-Host "主屏: http://localhost:5173/#/chat"
