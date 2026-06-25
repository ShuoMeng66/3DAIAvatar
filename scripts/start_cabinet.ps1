# ElderTalk 全息仓一键启动脚本 (Windows PowerShell)
# 用法：右键 → "使用 PowerShell 运行"，或在终端执行 .\scripts\start_cabinet.ps1

$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BACKEND_DIR = Join-Path $ROOT "backend"
$FRONTEND_DIR = Join-Path $ROOT "frontend"
$BACKEND_PORT = 8010
$FRONTEND_PORT = 5173

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ElderTalk 全息仓启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 启动后端
Write-Host "[1/4] 启动后端服务..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    python -m uvicorn main:app --host 0.0.0.0 --port 8010 2>&1
} -ArgumentList $BACKEND_DIR

# 2. 启动前端
Write-Host "[2/4] 启动前端开发服务器..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev -- --host 0.0.0.0 2>&1
} -ArgumentList $FRONTEND_DIR

# 3. 等待服务就绪
Write-Host "[3/4] 等待服务就绪..." -ForegroundColor Yellow
$maxWait = 30
$waited = 0
do {
    Start-Sleep -Seconds 2
    $waited += 2
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($health) { break }
    } catch {}
} while ($waited -lt $maxWait)

if ($waited -ge $maxWait) {
    Write-Host "警告：后端服务未在 ${maxWait}s 内就绪，请手动检查" -ForegroundColor Red
}

# 4. 打开主屏
Write-Host "[4/4] 打开主屏控制页面..." -ForegroundColor Yellow
Start-Process "http://localhost:$FRONTEND_PORT/#/chat"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "主屏控制端：http://localhost:$FRONTEND_PORT/#/chat" -ForegroundColor White
Write-Host ""
Write-Host "副屏全息仓（在第二显示器上执行）：" -ForegroundColor Cyan
Write-Host "  chrome.exe --kiosk --window-position=1920,0 --window-size=1440,2560 --app=http://localhost:$FRONTEND_PORT/#/cabinet" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止所有服务" -ForegroundColor Gray

# 保持脚本运行，等待用户中断
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Write-Host "正在停止服务..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue
    Write-Host "已停止。" -ForegroundColor Green
}