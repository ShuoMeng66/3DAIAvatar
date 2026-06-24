# Tasks: Session 7C — WebRTC 信令补全 + 2D 数字人黑底降级

- [x] Task 1: 重写 `frontend/src/services/webrtc.ts`
  - [x] 保留 `createPeerConnection()`：RTCPeerConnection + STUN
  - [x] 重写 `connectWebRTC()`：addTransceiver(audio+video recvonly) → createOffer → setLocalDescription → sendOffer → setRemoteDescription
  - [x] 添加 ICE 候选收集（`onicecandidate` 无需发送，Linly 使用 vanilla ICE）
  - [x] 保留 `closeWebRTC()` 清理逻辑
  - **验证**：TypeScript 编译通过

- [x] Task 2: 重写 `frontend/src/hooks/useWebRTC.ts`
  - [x] 状态：`idle | connecting | connected | failed`
  - [x] `connect()` 方法：创建 PC → 调用 connectWebRTC → 绑定 ontrack 到 videoRef
  - [x] 自动重连：失败后最多重试 3 次，间隔 2 秒
  - [x] 暴露 `videoRef`、`connectionState`、`connect()`、`disconnect()`
  - [x] 组件卸载时自动 close
  - **验证**：TypeScript 编译通过

- [x] Task 3: 修改 `frontend/src/services/api.ts`
  - [x] 修正 `sendOffer` 端点：`/api/v1/webrtc/offer` → `/api/v1/offer`
  - **验证**：端点路径与 backend 一致

- [x] Task 4: 修改 `frontend/src/pages/CabinetPage.tsx` 增加 2D fallback
  - [x] 读取 `VITE_CABINET_MODE` 环境变量（`3d | 2d | auto`，默认 `auto`）
  - [x] 集成 `useWebRTC` hook
  - [x] 2D 视频层：`<video ref={videoRef}>` + `object-fit: contain` + 黑底 `#000000`
  - [x] `auto` 模式：3D 场景默认显示，WebRTC 连接成功后在右下角 PiP 叠加小窗
  - [x] `2d` 模式：隐藏 3D，仅显示 2D 视频
  - [x] `3d` 模式：仅 3D 场景，不启动 WebRTC
  - [x] 连接失败时显示错误提示，3D 场景仍正常渲染
  - **验证**：TypeScript 编译通过，无白底

- [x] Task 5: 修改 `frontend/src/styles/cabinet.css` 增加 2D 视频样式
  - [x] `.cabinet-video-layer`：全屏黑底，居中
  - [x] `.cabinet-video-layer video`：`object-fit: contain`，`width/height: 100%`
  - [x] `.cabinet-pip`：PiP 小窗样式（右下角，圆角，z-index）
  - **验证**：样式无白底

- [x] Task 6: 修改 `backend/main.py` 的 `/offer` 端点
  - [x] 从占位改为代理：`POST /offer` → `httpx` 转发到 `LINLY_STREAM_URL/offer`
  - [x] 转发原始请求体（SDP offer JSON）
  - [x] 返回 Linly 的 response（SDP answer JSON）
  - [x] Linly 不可达时返回 503 + `{"error": "Linly-Talker-Stream 未启动", "status": "unavailable"}`
  - [x] 新增 `backend/requirements.txt` 中 `httpx` 依赖

- [x] Task 7: 修改 `backend/config.py`
  - [x] 新增 `LINLY_STREAM_URL` 配置项，默认 `http://localhost:8000`
  - **验证**：配置可被 main.py 读取

- [x] Task 8: 更新 `.env.example`
  - [x] 新增 `VITE_CABINET_MODE=auto`（可选值：`3d | 2d | auto`）
  - [x] 新增 `LINLY_STREAM_URL=http://localhost:8000`
  - **验证**：格式正确

- [x] Task 9: 端到端验证
  - [x] TypeScript 编译零错误
  - [x] Python 语法检查通过（手动审查）
  - [x] `/offer` 端点 Linly 未启动时返回 503 JSON
  - [x] 前端 WebRTC 连接失败时显示错误提示，3D 场景正常
  - **验证**：所有场景通过

- [x] Task 10: 创建 `SESSION_7C_DONE.md`
  - [x] 记录新增/修改文件清单
  - [x] 记录验收结果
  - [x] 记录已知问题

# Task Dependencies
- Task 2 依赖 Task 1（需要 webrtc.ts 函数）
- Task 3 独立，可与 Task 1-2 并行
- Task 4 依赖 Task 2（需要 useWebRTC hook）
- Task 5 可与 Task 4 并行
- Task 6 依赖 Task 7（需要 LINLY_STREAM_URL 配置）
- Task 7 独立
- Task 8 独立
- Task 9 依赖 Task 4-6 完成
- Task 10 依赖 Task 9 完成