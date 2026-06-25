# Session：修复 ElderTalk 数字人 WebRTC 视频无法加载

## Why
Linly-Talker-Stream 已在 AutoDL 上就绪（`curl localhost:8000/health` → OK），但前端 `/chat` 页数字人视频始终不显示。根因有 5 个：前端未调用 `connect()`、offer 路径 404、后端代理不处理 HTTPS、健康检查路径错误、AvatarPlayer 状态文案不准确。

## What Changes
- **BREAKING**: 后端 `/offer` 代理增加 `verify=False` 支持 Linly 自签名 HTTPS
- 修改 `api.ts` sendOffer 路径：`/api/v1/offer` → `/offer`
- 修改 `ChatPage.tsx`：增加 `useEffect` 自动调用 `connect()`
- 修改 `api.ts` healthCheck 路径：`/api/v1/health` → `/health`
- 修改 `AvatarPlayer.tsx`：`idle` 状态显示「未连接」而非「加载中」
- 修改 `CabinetPage.tsx`：健康检查路径修正
- 更新 `.env.example` 中 LINLY_STREAM_URL 默认值

## Impact
- Affected specs: session-7c-webrtc-signaling, session-7d-cabinet-sync
- Affected code: `backend/main.py`, `backend/config.py`, `frontend/src/services/api.ts`, `frontend/src/pages/ChatPage.tsx`, `frontend/src/components/AvatarPlayer.tsx`, `frontend/src/pages/CabinetPage.tsx`, `.env.example`

## ADDED Requirements
### Requirement: Linly 代理支持 HTTPS 自签名证书
后端 `/offer` 端点 SHALL 使用 `httpx.AsyncClient(verify=False)` 代理到 Linly-Talker-Stream。

#### Scenario: 代理 HTTPS Linly
- **WHEN** `LINLY_STREAM_URL=https://127.0.0.1:8000` 且 Linly 使用自签名证书
- **THEN** `POST /offer` 成功代理并返回 SDP answer

### Requirement: 前端 offer 路径与后端一致
前端 `sendOffer()` SHALL 请求 `POST /offer`（与后端路由匹配）。

#### Scenario: offer 请求成功
- **WHEN** 前端调用 `sendOffer(sdp, 'offer')`
- **THEN** 请求发送到 `${API_BASE}/offer` 并返回 200

### Requirement: ChatPage 自动建立 WebRTC
ChatPage 组件 SHALL 在挂载时自动调用 `useWebRTC().connect()` 建立连接。

#### Scenario: 页面加载自动连接
- **WHEN** 用户打开 `/chat` 页面
- **THEN** WebRTC 自动开始连接，无需手动操作

### Requirement: 健康检查路径正确
`api.ts` healthCheck 和 CabinetPage 健康检查 SHALL 使用 `/health`（后端实际端点）。

## MODIFIED Requirements
### Requirement: AvatarPlayer 状态文案
- `idle` →「未连接」而非「数字人加载中...」
- `failed` →「连接失败，请检查 Linly 服务」
- `connecting` → 保持「连接中...」