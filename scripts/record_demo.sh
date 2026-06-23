#!/bin/bash
# ============================================
# ElderTalk 演示录制脚本
# 使用 ffmpeg 录屏 + 录音
# ============================================
# 用法: ./scripts/record_demo.sh [输出文件名]
# 默认输出: demo_recording_YYYYMMDD_HHMMSS.mp4

set -e

OUTPUT_FILE="${1:-demo_recording_$(date +%Y%m%d_%H%M%S).mp4}"
DURATION="${2:-120}"  # 默认录制 2 分钟

echo "=========================================="
echo "ElderTalk 演示录制脚本"
echo "=========================================="
echo ""
echo "输出文件: $OUTPUT_FILE"
echo "录制时长: ${DURATION}秒"
echo ""
echo "检查依赖..."

# 检查 ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "错误: 未找到 ffmpeg，请先安装:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu: sudo apt install ffmpeg"
    echo "  Windows: winget install ffmpeg"
    exit 1
fi

echo "ffmpeg 已安装 ✓"
echo ""

# 检测操作系统
OS="$(uname -s)"
case "$OS" in
    Linux*)     DISPLAY_INPUT=":0.0+x11grab";;
    Darwin*)    DISPLAY_INPUT="1:0" ;;  # macOS 使用 avfoundation
    *)          echo "不支持的操作系统: $OS（脚本需要手动调整录屏参数）"
                exit 1;;
esac

echo "录制将在 3 秒后开始..."
echo "请确保："
echo "  1. 前端已在 http://localhost:5173 运行"
echo "  2. 后端已在 http://localhost:8010 运行"
echo "  3. 麦克风已准备就绪"
echo ""
sleep 3

echo "开始录制: $(date)"
echo ""

# Linux: x11grab + pulse
if [[ "$OS" == "Linux" ]]; then
    ffmpeg \
        -video_size 1280x720 \
        -framerate 30 \
        -f x11grab \
        -i :0.0 \
        -f pulse \
        -i default \
        -t "$DURATION" \
        -c:v libx264 -preset ultrafast -crf 23 \
        -c:a aac -b:a 128k \
        -pix_fmt yuv420p \
        "$OUTPUT_FILE"
# macOS: avfoundation
elif [[ "$OS" == "Darwin" ]]; then
    # 列出设备: ffmpeg -f avfoundation -list_devices true -i ""
    ffmpeg \
        -f avfoundation \
        -capture_cursor 1 \
        -i "1:0" \
        -t "$DURATION" \
        -c:v libx264 -preset ultrafast -crf 23 \
        -c:a aac -b:a 128k \
        -pix_fmt yuv420p \
        "$OUTPUT_FILE"
fi

echo ""
echo "录制完成: $(date)"
echo "输出文件: $OUTPUT_FILE"
echo ""
echo "文件信息:"
ffprobe -v quiet -print_format json -show_format -show_streams "$OUTPUT_FILE" | head -20
echo ""
echo "=========================================="
echo "如需上传到 GitHub，请确认文件大小后提交"
echo "=========================================="