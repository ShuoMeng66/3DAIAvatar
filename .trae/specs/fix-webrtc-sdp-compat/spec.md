# 修复 WebRTC SDP 兼容性 + 重试限制 + 文档

## Why
Linly-Talker-Stream `webrtc.py` 使用 `pc.addTrack()` 创建 transceiver（audio=索引0, video=索引1），然后通过 `pc.getTransceivers()[1]` 设置视频编码偏好。但前端 `webrtc.ts` 使用 `addTransceiver('audio')` + `addTransceiver('video')` 预创建了 2 个 transceiver，导致 Linly 收到 offer 后 `addTrack` 又创建 2 个，总共 4 个 transceiver。`getTransceivers()[1]` 拿到的是客户端预创建的视频 transceiver（codec 列表为空），触发 `ValueError: None is not in list`。

同时，`ChatPage` useEffect 每次触发 `connect()` 都重置 `retryCountRef=0`，导致失败后无限重试，Linly 侧 session 不断堆积。

## What Changes
- **BREAKING**: `webrtc.ts` 移除 `addTransceiver`，改用 `createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })`
- `useWebRTC.ts` 增加 `connectingRef` 防止重复调用 `connect()`
- `HOLOGRAM_CABINET.md` 新增远程部署 WebRTC 注意事项（SSH 隧道不转发 UDP）

## Impact
- Affected specs: fix-webrtc-video-loading
- Affected code: `frontend/src/services/webrtc.ts`, `frontend/src/hooks/useWebRTC.ts`, `HOLOGRAM_CABINET.md`

## ADDED Requirements
### Requirement: SDP 与 Linly 兼容
前端 `createOffer()` SHALL 使用 `{ offerToReceiveAudio: true, offerToReceiveVideo: true }` 而非 `addTransceiver`，确保 transceiver 仅由 Linly 服务端创建。

#### Scenario: WebRTC 连接成功
- **WHEN** 前端发送 offer 到 Linly
- **THEN** Linly `getTransceivers()[1]` 正确获取视频 transceiver，`setCodecPreferences` 不报 ValueError

### Requirement: 连接重试限流
`useWebRTC` SHALL 在 `connecting` 或 `connected` 状态下拒绝重复 `connect()` 调用，避免 session 堆积。

#### Scenario: 防止重复连接
- **WHEN** `connect()` 已在执行中
- **THEN** 后续 `connect()` 调用被忽略，不创建新 PC

### Requirement: 远程部署文档
`HOLOGRAM_CABINET.md` SHALL 说明 WebRTC 需要 UDP 直连，SSH 隧道仅转发 TCP 不够用。