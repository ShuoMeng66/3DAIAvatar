#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== ElderTalk start_all ==="

if [ ! -f "$ROOT/.env" ]; then
  echo "请先 cp .env.example .env 并配置 LLM_API_KEY"
  exit 1
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "安装 frontend 依赖..."
  (cd frontend && npm install)
fi

if ! python -c "import fastapi" 2>/dev/null; then
  echo "安装 backend 依赖..."
  pip install -r backend/requirements.txt
fi

LINLY_DIR="$ROOT/third_party/Linly-Talker-Stream"
if [ -d "$LINLY_DIR" ] && curl -sf http://localhost:8000/health >/dev/null 2>&1; then
  echo "[OK] Linly 已在运行"
elif [ -d "$LINLY_DIR/.venv" ] || command -v uv >/dev/null 2>&1; then
  echo "启动 Linly（若未安装模型可能失败）..."
  (cd "$LINLY_DIR" && nohup uv run python src/server/app.py --config config/config_musetalk.yaml \
    > "$ROOT/linly.log" 2>&1 &) || true
  sleep 5
fi

echo "启动 Backend..."
(cd backend && nohup python -m uvicorn main:app --host 0.0.0.0 --port 8010 \
  > "$ROOT/backend.log" 2>&1 &)

for i in $(seq 1 15); do
  sleep 2
  curl -sf http://localhost:8010/health >/dev/null && break
done

echo "启动 Frontend..."
(cd frontend && nohup npm run dev -- --host 0.0.0.0 > "$ROOT/frontend.log" 2>&1 &)

sleep 3
"$ROOT/scripts/check_webrtc.sh" || true

echo ""
echo "主屏: http://localhost:5173/#/chat"
echo "全息: http://localhost:5173/#/cabinet"
