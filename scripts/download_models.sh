#!/bin/bash
# ============================================
# ElderTalk 模型一键下载脚本
# 优先使用 ModelScope 国内镜像，fallback 到 HuggingFace
# ============================================
set -e

MODELS_DIR="${MODELS_DIR:-./models}"
mkdir -p "$MODELS_DIR"

# --- 下载函数 ---
download_model() {
    local name="$1"
    local modelscope_id="$2"
    local huggingface_id="$3"
    local target_dir="$4"
    
    echo "=========================================="
    echo "下载模型: $name"
    echo "=========================================="
    mkdir -p "$target_dir"
    
    # 优先尝试 ModelScope
    if [ -n "$modelscope_id" ]; then
        echo "尝试从 ModelScope 下载..."
        if pip install modelscope -q 2>/dev/null; then
            python -c "
from modelscope import snapshot_download
snapshot_download('$modelscope_id', cache_dir='$target_dir')
print('ModelScope 下载成功: $name')
" && return 0
        fi
        echo "ModelScope 下载失败，尝试 HuggingFace..."
    fi
    
    # Fallback: HuggingFace 镜像
    if [ -n "$huggingface_id" ]; then
        echo "尝试从 HuggingFace 镜像下载..."
        export HF_ENDPOINT=https://hf-mirror.com
        if pip install huggingface_hub -q 2>/dev/null; then
            python -c "
from huggingface_hub import snapshot_download
snapshot_download('$huggingface_id', cache_dir='$target_dir')
print('HuggingFace 下载成功: $name')
" && return 0
        fi
    fi
    
    echo "警告: $name 下载失败，请手动下载"
    return 1
}

# ============================================
# 1. MuseTalk 权重
# ============================================
download_model \
    "MuseTalk" \
    "" \
    "TMElyralab/MuseTalk" \
    "$MODELS_DIR/musetalk"

# ============================================
# 2. OmniSenseVoice (ASR)
# ============================================
download_model \
    "OmniSenseVoice" \
    "iic/SenseVoiceSmall" \
    "FunAudioLLM/SenseVoiceSmall" \
    "$MODELS_DIR/asr"

# ============================================
# 3. CosyVoice (TTS)
# ============================================
download_model \
    "CosyVoice" \
    "iic/CosyVoice-300M" \
    "FunAudioLLM/CosyVoice-300M" \
    "$MODELS_DIR/tts/cosyvoice"

# ============================================
# 4. Qwen2.5-7B-Instruct (LLM)
# ============================================
download_model \
    "Qwen2.5-7B-Instruct" \
    "qwen/Qwen2.5-7B-Instruct" \
    "Qwen/Qwen2.5-7B-Instruct" \
    "$MODELS_DIR/llm/qwen2.5-7b"

echo ""
echo "=========================================="
echo "模型下载完成！"
echo "模型存放目录: $MODELS_DIR"
echo "=========================================="
echo ""
echo "各模型下载后请检查:"
echo "  MuseTalk:     $MODELS_DIR/musetalk/"
echo "  ASR (SenseVoice): $MODELS_DIR/asr/"
echo "  TTS (CosyVoice):  $MODELS_DIR/tts/cosyvoice/"
echo "  LLM (Qwen):       $MODELS_DIR/llm/qwen2.5-7b/"
echo ""
echo "注意: 如果使用 API 模式（DeepSeek/DashScope），"
echo "则无需下载 LLM 模型，只需配置 .env 中的 API_KEY 即可。"