#!/usr/bin/env bash
# ElderTalk WebRTC 自检脚本
set -e

API_BASE="${API_BASE:-http://localhost:8010}"
LINLY_URL="${LINLY_URL:-http://localhost:8000}"
LINLY_HTTPS="${LINLY_HTTPS:-https://127.0.0.1:8000}"

echo "=== ElderTalk WebRTC 自检 ==="
echo "API: $API_BASE"
echo "Linly: $LINLY_URL (fallback $LINLY_HTTPS)"
echo ""

fail=0

if curl -sf "$API_BASE/health" > /dev/null; then
  echo "[OK] Backend /health"
else
  echo "[FAIL] Backend /health — 请先启动 backend (port 8010)"
  fail=1
fi

linly_ok=0
if curl -sfk "$LINLY_HTTPS/health" > /dev/null 2>&1; then
  echo "[OK] Linly /health (HTTPS)"
  linly_ok=1
elif curl -sf "$LINLY_URL/health" > /dev/null 2>&1; then
  echo "[OK] Linly /health (HTTP)"
  linly_ok=1
else
  echo "[FAIL] Linly /health — 请先启动 Linly-Talker-Stream (port 8000)"
  fail=1
fi

if curl -sf "$API_BASE/health/full" > /dev/null; then
  echo "[OK] Backend /health/full"
  curl -s "$API_BASE/health/full"
  echo ""
else
  echo "[WARN] /health/full 不可用"
fi

if [ -f /root/autodl-tmp/ElderTalk/.env ]; then
  ice_host=$(grep '^LINLY_ICE_PUBLIC_HOST=' /root/autodl-tmp/ElderTalk/.env 2>/dev/null | cut -d= -f2-)
  if [ -n "$ice_host" ]; then
    echo "[OK] LINLY_ICE_PUBLIC_HOST=${ice_host}"
  else
    echo "[WARN] LINLY_ICE_PUBLIC_HOST 未设置 — 远程浏览器可能 ICE connecting"
  fi
fi

echo ""
if [ "$fail" -eq 0 ]; then
  echo "信令层就绪。若浏览器仍无画面，请检查："
  echo "  1. AutoDL 是否映射 UDP 8000（SSH 隧道不能传视频）"
  echo "  2. 运行 configure_pc_access.sh autodl 或 hybrid 并填入公网 URL"
  echo "  3. 打开 /#/chat 查看 ICE 状态"
  echo "  4. 见 docs/webrtc-troubleshooting.md"
  exit 0
else
  echo "自检未通过，请先修复上述 FAIL 项"
  exit 1
fi
