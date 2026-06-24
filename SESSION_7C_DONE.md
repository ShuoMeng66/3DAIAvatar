# SESSION_7C_DONE.md — WebRTC 信令补全 + 2D 数字人黑底降级

## 完成时间

2026-06-24

## 目标

在 Session 7B 的 3D 场景基础上，补全 WebRTC 实时视频链路，使全息仓能接收 Linly-Talker-Stream 的数字人视频流，同时提供 2D fallback 层。

## 新增文件

| 文件 | 说明 |
|------|------|
| （无新增文件，全部为修改现有文件） | |

## 修改文件

| 文件 | 变更 |
|------|------|
| `frontend/src/services/webrtc.ts` | 重写：完整 WebRTC offer/answer 流程 + STUN + transceiver |
| `frontend/src/hooks/useWebRTC.ts` | 重写：状态管理 idle/connecting/connected/failed + 自动重连 3 次 |
| `frontend/src/services/api.ts` | 修正 `sendOffer` 端点：`/api/v1/webrtc/offer` → `/api/v1/offer` |
| `frontend/src/pages/CabinetPage.tsx` | 新增 2D fallback 层，集成 useWebRTC，支持 3d/2d/auto 模式 |
| `frontend/src/styles/cabinet.css` | 新增 `.cabinet-video-layer`、`.cabinet-pip`、`.cabinet-error` 样式 |
| `backend/main.py` | `/offer` 从占位改为 httpx 代理到 Linly-Talker-Stream |
| `backend/config.py` | 新增 `LINLY_STREAM_URL` 配置项 |
| `backend/requirements.txt` | 新增 `httpx==0.27.0` |
| `.env.example` | 新增 `VITE_CABINET_MODE`、`LINLY_STREAM_URL` |

## 技术细节

### WebRTC 连接流程
1. `createPeerConnection()` → RTCPeerConnection + STUN
2. `addTransceiver(audio, recvonly)` + `addTransceiver(video, recvonly)`
3. `createOffer()` → `setLocalDescription()`
4. `POST /api/v1/offer` → 后端代理到 `LINLY_STREAM_URL/offer`
5. `setRemoteDescription(answer)` → 完成握手
6. `ontrack` → 绑定 MediaStream 到 `<video>` 元素

### 自动重连
- 失败时最多重试 3 次，间隔 2 秒
- `mountedRef` 防止组件卸载后继续重连
- 连接成功后重置重试计数

### 2D Fallback 模式
- **3d**：仅 3D 场景，不启动 WebRTC
- **2d**：仅 2D 视频层，全屏黑底，`object-fit: contain` 居中
- **auto**（默认）：3D 场景默认显示，WebRTC 成功后右下角 9:16 PiP 小窗叠加
- 失败时 2D 模式显示黑底错误提示，auto 模式 3D 场景仍正常渲染

### Backend 信令代理
- 成功：转发 Linly 响应（SDP answer JSON）
- 失败：`httpx.ConnectError` → 503 `{"error": "Linly-Talker-Stream 未启动", "status": "unavailable"}`
- 超时：`httpx.TimeoutException` → 504
- 其他错误：502

## 验收结果

- [x] TypeScript 编译零错误
- [x] Python 语法审查通过
- [x] WebRTC 连接流程完整：offer → answer → ontrack
- [x] 自动重连 3 次逻辑正确
- [x] 2D 视频层黑底 `#000000`，无白底
- [x] 3d/2d/auto 三种模式切换逻辑完整
- [x] 连接失败时黑底错误提示，3D 场景正常
- [x] 组件卸载时 WebRTC 资源清理
- [x] 不删 hologram/ LED 风扇模块

## 已知问题

- 需要 Linly-Talker-Stream 实际运行才能验证完整 WebRTC 连接
- `httpx` 需要 `pip install httpx` 安装到 backend 环境

## 约束遵守

- [x] 不删 hologram/ LED 风扇模块
- [x] 2D fallback 黑底，无白底/浅灰
- [x] 未修改 `/hologram` 路由