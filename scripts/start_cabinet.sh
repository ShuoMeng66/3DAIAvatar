#!/bin/bash
# ElderTalk 全息仓一键启动脚本 (Linux/macOS)
# 用法：chmod +x scripts/start_cabinet.sh && ./scripts/start_cabinet.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT/backend"
FRONTEND_DIR="$ROOT/frontend"
BACKEND_PORT=8010
FRONTEND_PORT=5173

echo "========================================"
echo "  ElderTalk 全息仓启动脚本"
echo "========================================"
echo ""

# 1. 启动后端
echo "[1/4] 启动后端服务..."
cd "$BACKEND_DIR"
python -m uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

# 2. 启动前端
echo "[2/4] 启动前端开发服务器..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

# 3. 等待服务就绪
echo "[3/4] 等待服务就绪..."
for i in $(seq 1 15); do
    sleep 2
    if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        break
    fi
    if [ $i -eq 15 ]; then
        echo "警告：后端服务未在 30s 内就绪，请手动检查"
    fi
done

# 4. 打开主屏
echo "[4/4] 打开主屏控制页面..."
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:$FRONTEND_PORT/#/chat"
elif command -v open &> /dev/null; then
    open "http://localhost:$FRONTEND_PORT/#/chat"
fi

echo ""
echo "========================================"
echo "  启动完成！"
echo "========================================"
echo ""
echo "主屏控制端：http://localhost:$FRONTEND_PORT/#/chat"
echo ""
echo "副屏全息仓（在第二显示器上执行）："
echo "  google-chrome --kiosk --window-position=1920,0 --window-size=1440,2560 --app=http://localhost:$FRONTEND_PORT/#/cabinet"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# 清理函数
cleanup() {
    echo ""
    echo "正在停止服务..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "已停止。"
}

trap cleanup EXIT INT TERM

# 等待子进程
wait