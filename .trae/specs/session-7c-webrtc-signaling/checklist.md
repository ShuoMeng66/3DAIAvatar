# Checklist: Session 7C — WebRTC 信令补全 + 2D 数字人黑底降级

## WebRTC 服务层
- [x] `webrtc.ts` 中 `createPeerConnection()` 使用 STUN 服务器
- [x] `webrtc.ts` 中 `connectWebRTC()` 包含完整 offer/answer 流程
- [x] `webrtc.ts` 中 `closeWebRTC()` 正确关闭连接
- [x] `webrtc.ts` 中添加了 audio+video recvonly transceiver

## WebRTC Hook
- [x] `useWebRTC.ts` 状态管理：idle → connecting → connected → failed
- [x] `useWebRTC.ts` 中 `connect()` 创建 PC 并绑定 ontrack
- [x] `useWebRTC.ts` 中失败自动重连最多 3 次，间隔 2 秒
- [x] `useWebRTC.ts` 暴露 `videoRef`、`connectionState`、`connect()`、`disconnect()`
- [x] `useWebRTC.ts` 组件卸载时清理资源

## API 端点
- [x] `api.ts` 中 `sendOffer` 端点路径为 `/api/v1/offer`

## 2D 视频 Fallback
- [x] `CabinetPage.tsx` 读取 `VITE_CABINET_MODE` 环境变量
- [x] `CabinetPage.tsx` 集成 `useWebRTC` hook
- [x] `2d` 模式：仅显示 2D 视频层，隐藏 3D 场景
- [x] `3d` 模式：仅显示 3D 场景，不启动 WebRTC
- [x] `auto` 模式：3D 默认显示，WebRTC 成功时 PiP 叠加
- [x] 2D 视频层背景为 `#000000`（纯黑）
- [x] 2D 视频 `object-fit: contain`，居中
- [x] 连接失败时显示错误提示，3D 场景仍正常

## 样式
- [x] `.cabinet-video-layer` 样式无白底
- [x] `.cabinet-video-layer video` 使用 `object-fit: contain`
- [x] `.cabinet-pip` 样式正确（右下角小窗）

## Backend /offer 端点
- [x] `/offer` 代理转发到 `LINLY_STREAM_URL/offer`
- [x] 使用 `httpx` 转发原始请求体
- [x] Linly 不可达时返回 503 + 错误 JSON
- [x] 错误 JSON 包含 `error` 和 `status` 字段

## 配置
- [x] `backend/config.py` 新增 `LINLY_STREAM_URL`，默认 `http://localhost:8000`
- [x] `.env.example` 新增 `VITE_CABINET_MODE=auto`
- [x] `.env.example` 新增 `LINLY_STREAM_URL=http://localhost:8000`
- [x] `backend/requirements.txt` 新增 `httpx`

## 约束
- [x] 不删 hologram/ LED 风扇模块
- [x] 2D fallback 黑底，无白底
- [x] TypeScript 编译零错误
- [x] Python 语法通过手动审查

## 文档
- [x] `SESSION_7C_DONE.md` 已创建
- [x] 完成记录包含文件清单和验收结果