#!/usr/bin/env bash
# 配置本机 PC 浏览器访问 ElderTalk（AutoDL 公网或 Cursor 端口转发）
# 用法:
#   ./scripts/configure_pc_access.sh cursor          # Cursor/SSH 转发 5173+8010（本机打开 localhost）
#   ./scripts/configure_pc_access.sh personal       # AutoDL 个人用户（6006 前端 + 6008 API）
#   ./scripts/configure_pc_access.sh hybrid <8000公网URL>  # Cursor 转发 + Linly 8000 公网（WebRTC）
#   ./scripts/configure_pc_access.sh autodl <5173公网URL> <8010公网URL> <8000公网URL>
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-cursor}"

parse_ice_from_url() {
  local url="$1"
  url="${url%/}"
  local host port
  if [[ "$url" =~ ^https?://([^:/]+)(:([0-9]+))? ]]; then
    host="${BASH_REMATCH[1]}"
    port="${BASH_REMATCH[3]:-8000}"
  else
    host="${url%%:*}"
    port="${url##*:}"
    [[ "$port" == "$host" ]] && port="8000"
  fi
  echo "${host}|${port}"
}

write_ice_env() {
  local linly_public="$1"
  local parsed host port
  parsed="$(parse_ice_from_url "$linly_public")"
  host="${parsed%%|*}"
  port="${parsed##*|}"

  if grep -q '^LINLY_ICE_PUBLIC_HOST=' "$ROOT/.env" 2>/dev/null; then
    sed -i "s|^LINLY_ICE_PUBLIC_HOST=.*|LINLY_ICE_PUBLIC_HOST=${host}|" "$ROOT/.env"
  else
    echo "LINLY_ICE_PUBLIC_HOST=${host}" >> "$ROOT/.env"
  fi
  if grep -q '^LINLY_ICE_PUBLIC_PORT=' "$ROOT/.env" 2>/dev/null; then
    sed -i "s|^LINLY_ICE_PUBLIC_PORT=.*|LINLY_ICE_PUBLIC_PORT=${port}|" "$ROOT/.env"
  else
    echo "LINLY_ICE_PUBLIC_PORT=${port}" >> "$ROOT/.env"
  fi
  echo "  LINLY_ICE_PUBLIC_HOST=${host}"
  echo "  LINLY_ICE_PUBLIC_PORT=${port}"
}

write_env() {
  local fe_origin="$1"
  local api_base="$2"
  local linly_public="$3"

  grep -q '^LLM_API_KEY=' "$ROOT/.env" || { echo "缺少 $ROOT/.env"; exit 1; }

  if grep -q '^FRONTEND_ORIGIN=' "$ROOT/.env"; then
    sed -i "s|^FRONTEND_ORIGIN=.*|FRONTEND_ORIGIN=${fe_origin}|" "$ROOT/.env"
  else
    echo "FRONTEND_ORIGIN=${fe_origin}" >> "$ROOT/.env"
  fi

  cat > "$ROOT/frontend/.env" <<EOF
VITE_API_BASE=${api_base}
VITE_LINLY_PUBLIC_URL=${linly_public}

VITE_CABINET_MODE=2d
VITE_KIOSK_CHROME=false

VITE_CABINET_WIDTH=1440
VITE_CABINET_HEIGHT=2560
VITE_CABINET_BG=#000000
EOF

  echo "已写入:"
  echo "  FRONTEND_ORIGIN=${fe_origin}"
  echo "  VITE_API_BASE=${api_base}"
  echo "  VITE_LINLY_PUBLIC_URL=${linly_public}"
  if [[ -n "$linly_public" ]]; then
    write_ice_env "$linly_public"
  fi
}

restart_frontend() {
  local port="${1:-5173}"
  pkill -f "vite --host" 2>/dev/null || true
  sleep 1
  cd "$ROOT/frontend"
  nohup npm run dev -- --host 0.0.0.0 --port "$port" > "$ROOT/frontend.log" 2>&1 &
  sleep 4
  echo "Frontend (port ${port}): $(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${port}/")"
}

restart_backend() {
  local port="${1:-8010}"
  pkill -f "uvicorn main:app" 2>/dev/null || true
  sleep 1
  cd "$ROOT/backend"
  nohup python3.10 -m uvicorn main:app --host 0.0.0.0 --port "$port" > "$ROOT/backend.log" 2>&1 &
  sleep 2
  echo "Backend (port ${port}): $(curl -s "http://localhost:${port}/health")"
}

clear_ice_env() {
  if grep -q '^LINLY_ICE_PUBLIC_HOST=' "$ROOT/.env" 2>/dev/null; then
    sed -i 's|^LINLY_ICE_PUBLIC_HOST=.*|LINLY_ICE_PUBLIC_HOST=|' "$ROOT/.env"
  fi
}

print_mapping_help() {
  echo ""
  echo "=== AutoDL 端口映射（WebRTC 视频必需）==="
  echo "在 AutoDL 控制台 → 实例 → 自定义服务，添加："
  echo "  8000  TCP+UDP  Linly WebRTC 媒体"
  echo "  8010  TCP      ElderTalk API"
  echo "  5173  TCP      Vite 前端"
  echo ""
  echo "映射完成后运行："
  echo "  $0 autodl <5173URL> <8010URL> <8000URL>"
  echo "或 Cursor 转发 5173/8010 + 仅 8000 公网："
  echo "  $0 hybrid <8000URL>"
}

case "$MODE" in
  cursor)
    write_env "http://localhost:5173" "http://localhost:8010" "http://localhost:8000"
    clear_ice_env
    restart_backend 8010
    restart_frontend 5173
    echo ""
    echo "=== Cursor / SSH 端口转发模式 ==="
    echo "1. 在 Cursor 底部「端口 / Ports」面板，转发 5173 和 8010"
    echo "2. 在你本机浏览器打开: http://localhost:5173/#/chat"
    echo "3. 文字对话可用；WebRTC 视频需映射 8000(UDP+TCP) 后用 autodl 或 hybrid 模式"
    print_mapping_help
    ;;
  hybrid)
    LINLY_PUBLIC="${2:?缺少 8000 公网 URL}"
    LINLY_PUBLIC="${LINLY_PUBLIC%/}"
    write_env "http://localhost:5173" "http://localhost:8010" "$LINLY_PUBLIC"
    restart_backend 8010
    restart_frontend 5173
    echo ""
    echo "=== Hybrid 模式（Cursor 5173/8010 + 公网 8000）==="
    echo "1. Cursor 转发 5173、8010"
    echo "2. 本机打开 http://localhost:5173/#/chat"
    echo "3. WebRTC 媒体走公网: ${LINLY_PUBLIC}"
    ;;
  autodl)
    FE_PUBLIC="${2:?缺少 5173 公网 URL}"
    API_PUBLIC="${3:?缺少 8010 公网 URL}"
    LINLY_PUBLIC="${4:?缺少 8000 公网 URL}"
    FE_PUBLIC="${FE_PUBLIC%/}"
    API_PUBLIC="${API_PUBLIC%/}"
    LINLY_PUBLIC="${LINLY_PUBLIC%/}"
    write_env "$FE_PUBLIC" "$API_PUBLIC" "$LINLY_PUBLIC"
    restart_backend 8010
    restart_frontend 5173
    echo ""
    echo "=== AutoDL 公网模式 ==="
    echo "在你本机浏览器打开: ${FE_PUBLIC}/#/chat"
    echo "请确认 AutoDL 控制台已映射 8000(UDP+TCP)、8010(TCP)、5173(TCP)"
    ;;
  personal)
    FE_PUBLIC="${2:-${AutoDLService6006URL:-}}"
    API_PUBLIC="${3:-${AutoDLService6008URL:-}}"
    FE_PUBLIC="${FE_PUBLIC%/}"
    API_PUBLIC="${API_PUBLIC%/}"
    if [[ -z "$FE_PUBLIC" || -z "$API_PUBLIC" ]]; then
      echo "错误: 未找到 AutoDL 公网 URL。"
      echo "请手动指定:"
      echo "  $0 personal <6006公网URL> <6008公网URL>"
      echo "或在 AutoDL 实例内运行（会自动读取 AutoDLService6006URL / 6008URL 环境变量）"
      exit 1
    fi
    write_env "$FE_PUBLIC" "$API_PUBLIC" ""
    clear_ice_env
    restart_backend 6008
    restart_frontend 6006
    echo ""
    echo "=== AutoDL 个人用户模式（6006 前端 + 6008 API）==="
    echo ""
    echo "在你本机浏览器（手机/电脑均可）直接打开:"
    echo "  ${FE_PUBLIC}/#/chat"
    echo ""
    echo "API 健康检查:"
    echo "  ${API_PUBLIC}/health"
    echo ""
    echo "说明:"
    echo "  - 文字聊天、页面访问：可用"
    echo "  - 数字人 WebRTC 视频：个人账号无法映射 UDP 8000，暂不支持远程视频"
    echo "  - 若需视频，需 AutoDL 企业认证后开放 8000(UDP+TCP) 端口"
    ;;
  *)
    echo "用法: $0 cursor | $0 personal [6006URL] [6008URL] | $0 hybrid <8000URL> | $0 autodl <5173URL> <8010URL> <8000URL>"
    exit 1
    ;;
esac
