# ============================================
# ElderTalk 演示录制脚本 (Windows PowerShell)
# ============================================
# 用法: .\scripts\record_demo.ps1 [-OutputFile "demo.mp4"] [-Duration 120]

param(
    [string]$OutputFile = "demo_recording_$(Get-Date -Format 'yyyyMMdd_HHmmss').mp4",
    [int]$Duration = 120
)

Write-Host "==========================================" -ForegroundColor Green
Write-Host "ElderTalk 演示录制脚本 (Windows)" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "输出文件: $OutputFile"
Write-Host "录制时长: ${Duration}秒"
Write-Host ""

# 检查 ffmpeg
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Host "错误: 未找到 ffmpeg" -ForegroundColor Red
    Write-Host "请安装: winget install ffmpeg 或 https://ffmpeg.org/download.html" -ForegroundColor Yellow
    exit 1
}

Write-Host "ffmpeg 已安装 ✓" -ForegroundColor Green
Write-Host ""
Write-Host "录制将在 3 秒后开始..." -ForegroundColor Yellow
Write-Host "请确保：" -ForegroundColor Cyan
Write-Host "  1. 前端已在 http://localhost:5173 运行"
Write-Host "  2. 后端已在 http://localhost:8010 运行"
Write-Host ""

Start-Sleep -Seconds 3

Write-Host "开始录制: $(Get-Date)" -ForegroundColor Green

# Windows: gdigrab (屏幕) + dshow (麦克风)
ffmpeg `
    -f gdigrab `
    -framerate 30 `
    -offset_x 0 -offset_y 0 `
    -video_size 1280x720 `
    -i desktop `
    -f dshow -i audio="Microphone (Realtek Audio)" `
    -t $Duration `
    -c:v libx264 -preset ultrafast -crf 23 `
    -c:a aac -b:a 128k `
    -pix_fmt yuv420p `
    $OutputFile

Write-Host ""
Write-Host "录制完成: $(Get-Date)" -ForegroundColor Green
Write-Host "输出文件: $OutputFile" -ForegroundColor Green