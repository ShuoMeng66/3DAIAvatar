# AutoDL 部署指南（ElderTalk / 颐语）

> 动态数字人依赖 Linly-Talker-Stream WebRTC。**信令走 TCP，媒体走 UDP** — SSH 隧道只能转发 API，不能转发视频。

## 核心结论

| 现象 | 原因 |
|------|------|
| `POST /offer` 返回 200，但浏览器无画面 | 信令已成功；**UDP 媒体未到达浏览器** |
| `curl localhost:8000/health` 在 AutoDL 上 OK | 只说明 Linly 进程正常，不代表 PC 端 WebRTC 可达 |
| SSH `-L 8010:localhost:8010` 后 API 正常 | 正常；但 **不能** 用 SSH 隧道替代 Linly 8000 的 UDP 映射 |

## 方案 A（推荐）：全栈在 AutoDL，浏览器直连公网

1. AutoDL 控制台 → 实例 → **自定义服务 / 端口映射**：
   - `8000` — Linly WebRTC（需 UDP）
   - `8010` — ElderTalk API
   - `5173` — Vite 前端（开发）或 Nginx 静态（生产）
2. 在 AutoDL 内启动 Linly + Backend + Frontend（见下方命令）
3. 浏览器访问 AutoDL 分配的公网 URL，**不使用 SSH 隧道**
4. `.env`（AutoDL 上）：

```env
LLM_API_KEY=sk-xxx
LLM_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
LINLY_STREAM_URL=http://127.0.0.1:8000
PORT=8010
```

## 方案 B：PC 本地前端 + AutoDL GPU 后端

1. AutoDL 映射 **8000（UDP+TCP）** 和 **8010（TCP）** 到公网
2. PC 上 SSH 隧道 **仅** 用于开发调试 API（可选）：

```bash
ssh -L 8010:localhost:8010 -p <端口> root@<AutoDL-IP>
```

3. PC 上 `frontend/.env`：

```env
VITE_API_BASE=http://localhost:8010
VITE_LINLY_PUBLIC_URL=http://<AutoDL公网映射>:<8000端口>
VITE_CABINET_MODE=2d
```

4. WebRTC ICE 必须能连到 AutoDL 公网 8000；若 ICE 一直 `checking`，检查端口映射与防火墙

## AutoDL 环境要求

| 项 | 推荐 |
|----|------|
| 镜像 | PyTorch 2.1.0 \| Python 3.10 \| CUDA 12.1 |
| GPU | RTX 4090 24GB |
| 数据盘 | ≥50GB |

## 安装与启动（AutoDL 内）

```bash
cd /root/autodl-tmp
git clone https://github.com/ShuoMeng66/3DAIAvatar.git
cd 3DAIAvatar

# Linly 环境
cd third_party/Linly-Talker-Stream
bash scripts/setup-env.sh musetalk
bash scripts/download_musetalk_weights.sh
sed -i 's/listenport: 8010/listenport: 8000/' config/config_musetalk.yaml

# ElderTalk 后端
cd /root/autodl-tmp/3DAIAvatar
cp .env.example .env
# 编辑 .env 填入 LLM_API_KEY
cd backend && pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 启动 Linly（终端 1）
cd ../third_party/Linly-Talker-Stream
nohup uv run python src/server/app.py --config config/config_musetalk.yaml \
  > /root/autodl-tmp/linly.log 2>&1 &

# 等待 Linly 就绪
for i in $(seq 1 12); do sleep 10; curl -sf http://localhost:8000/health && break; done

# 启动 Backend（终端 2）
cd /root/autodl-tmp/3DAIAvatar/backend
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8010 \
  > /root/autodl-tmp/backend.log 2>&1 &

# 启动 Frontend（终端 3）
cd ../frontend
cp .env.example .env
npm install
npm run dev -- --host 0.0.0.0
```

## 自检脚本

```bash
./scripts/check_webrtc.sh
```

## offer 200 无画面 — 决策树

```
POST /offer 是否 200？
├─ 否 → 检查 Linly 是否启动、LINLY_STREAM_URL、backend 日志
└─ 是 → 打开 chrome://webrtc-internals
    ├─ ICE connection state = failed / disconnected
    │   → 映射 AutoDL 8000 UDP；勿仅依赖 SSH 隧道
    ├─ ICE = connected/completed，但无 video track
    │   → 检查 answer 是否含 sdp；运行 check_webrtc.sh
    └─ 有 video track，但 UI 黑屏
        → 检查 /cabinet 是否 VITE_CABINET_MODE=2d；刷新 /chat
```

## 相关文档

- [HOLOGRAM_CABINET.md](../../HOLOGRAM_CABINET.md) — 全息仓硬件与 kiosk
- [docs/webrtc-troubleshooting.md](../webrtc-troubleshooting.md) — WebRTC 故障排查
