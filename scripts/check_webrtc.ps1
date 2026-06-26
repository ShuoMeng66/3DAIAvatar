# ElderTalk WebRTC 自检脚本 (Windows)
$ErrorActionPreference = "Continue"

$API_BASE = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:8010" }
$LINLY_URL = if ($env:LINLY_URL) { $env:LINLY_URL } else { "http://localhost:8000" }

Write-Host "=== ElderTalk WebRTC 自检 ===" -ForegroundColor Cyan
Write-Host "API: $API_BASE"
Write-Host "Linly: $LINLY_URL"
Write-Host ""

$fail = 0

try {
    Invoke-RestMethod -Uri "$API_BASE/health" -TimeoutSec 3 | Out-Null
    Write-Host "[OK] Backend /health" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Backend /health" -ForegroundColor Red
    $fail = 1
}

try {
    Invoke-RestMethod -Uri "$LINLY_URL/health" -TimeoutSec 3 -SkipCertificateCheck | Out-Null
    Write-Host "[OK] Linly /health" -ForegroundColor Green
} catch {
    try {
        Invoke-RestMethod -Uri "https://127.0.0.1:8000/health" -TimeoutSec 3 -SkipCertificateCheck | Out-Null
        Write-Host "[OK] Linly /health (HTTPS)" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Linly /health — 请先启动 Linly (port 8000)" -ForegroundColor Red
        $fail = 1
    }
}

try {
    $full = Invoke-RestMethod -Uri "$API_BASE/health/full" -TimeoutSec 3
    Write-Host "[OK] Backend /health/full: $($full | ConvertTo-Json -Compress)"
} catch {
    Write-Host "[WARN] /health/full 不可用" -ForegroundColor Yellow
}

Write-Host ""
if ($fail -eq 0) {
    Write-Host "信令层就绪。本地一体机请打开 http://localhost:5173/#/chat" -ForegroundColor Green
    exit 0
} else {
    Write-Host "自检未通过" -ForegroundColor Red
    exit 1
}
