# ============================================
# ElderTalk 模型一键下载脚本 (Windows PowerShell)
# 优先使用 ModelScope 国内镜像，fallback 到 HuggingFace
# ============================================

param(
    [string]$ModelsDir = "./models"
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Green
Write-Host "ElderTalk 模型下载脚本" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# 创建目录
New-Item -ItemType Directory -Force -Path $ModelsDir | Out-Null
New-Item -ItemType Directory -Force -Path "$ModelsDir\musetalk" | Out-Null
New-Item -ItemType Directory -Force -Path "$ModelsDir\asr" | Out-Null
New-Item -ItemType Directory -Force -Path "$ModelsDir\tts\cosyvoice" | Out-Null
New-Item -ItemType Directory -Force -Path "$ModelsDir\llm\qwen2.5-7b" | Out-Null

# --- 下载函数 ---
function Download-Model {
    param(
        [string]$Name,
        [string]$ModelScopeId,
        [string]$HuggingFaceId,
        [string]$TargetDir
    )
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "下载模型: $Name" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    
    New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
    
    # 优先尝试 ModelScope
    if ($ModelScopeId) {
        Write-Host "尝试从 ModelScope 下载..." -ForegroundColor Yellow
        try {
            pip install modelscope -q 2>$null
            python -c @"
from modelscope import snapshot_download
snapshot_download('$ModelScopeId', cache_dir='$TargetDir')
print('ModelScope 下载成功: $Name')
"@
            if ($LASTEXITCODE -eq 0) {
                Write-Host "ModelScope 下载成功: $Name" -ForegroundColor Green
                return
            }
        } catch {
            Write-Host "ModelScope 下载失败，尝试 HuggingFace..." -ForegroundColor Yellow
        }
    }
    
    # Fallback: HuggingFace 镜像
    if ($HuggingFaceId) {
        Write-Host "尝试从 HuggingFace 镜像下载..." -ForegroundColor Yellow
        try {
            $env:HF_ENDPOINT = "https://hf-mirror.com"
            pip install huggingface_hub -q 2>$null
            python -c @"
from huggingface_hub import snapshot_download
snapshot_download('$HuggingFaceId', cache_dir='$TargetDir')
print('HuggingFace 下载成功: $Name')
"@
            if ($LASTEXITCODE -eq 0) {
                Write-Host "HuggingFace 下载成功: $Name" -ForegroundColor Green
                return
            }
        } catch {
            Write-Host "HuggingFace 下载失败" -ForegroundColor Yellow
        }
    }
    
    Write-Host "警告: $Name 下载失败，请手动下载" -ForegroundColor Red
}

# 下载各模型
Download-Model -Name "MuseTalk" -ModelScopeId "" -HuggingFaceId "TMElyralab/MuseTalk" -TargetDir "$ModelsDir\musetalk"
Download-Model -Name "OmniSenseVoice" -ModelScopeId "iic/SenseVoiceSmall" -HuggingFaceId "FunAudioLLM/SenseVoiceSmall" -TargetDir "$ModelsDir\asr"
Download-Model -Name "CosyVoice" -ModelScopeId "iic/CosyVoice-300M" -HuggingFaceId "FunAudioLLM/CosyVoice-300M" -TargetDir "$ModelsDir\tts\cosyvoice"
Download-Model -Name "Qwen2.5-7B-Instruct" -ModelScopeId "qwen/Qwen2.5-7B-Instruct" -HuggingFaceId "Qwen/Qwen2.5-7B-Instruct" -TargetDir "$ModelsDir\llm\qwen2.5-7b"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "模型下载完成！" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "注意: 如果使用 API 模式（DeepSeek/DashScope），" -ForegroundColor Yellow
Write-Host "则无需下载 LLM 模型，只需配置 .env 中的 API_KEY 即可。" -ForegroundColor Yellow