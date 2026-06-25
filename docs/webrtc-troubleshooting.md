# WebRTC 故障排查（ElderTalk / 颐语）

合并自 `.trae/specs/fix-webrtc-*` 系列 spec 的实操结论。

## 症状：POST /offer 200，但无视频

### 1. 媒体层 — UDP 不可达（AutoDL / 远程最常见）

- SSH `-L 8010:localhost:8010` **只转发 API**
- WebRTC RTP 走 **UDP 8000**，必须 AutoDL 公网映射
- 见 [docs/deploy/autodl.md](deploy/autodl.md)

### 2. 应用层 — video 元素未挂载（Cabinet auto 模式）

- 已修复：`<video>` 始终挂载 + pending stream 补绑
- 推荐 `VITE_CABINET_MODE=2d`

### 3. 信令层 — answer 无效

- 200 但 body 缺 `sdp`/`type` → 前端 throw 并重试
- backend `/offer` 校验 Linly 响应

### 4. 连接状态 — ICE completed 未识别

- 已修复：`connected` 与 `completed` 均视为媒体就绪
- 需 `ontrack` 收到 video track 才显示 connected UI

### 5. sessionid 未绑定

- Linly answer 含 `sessionid`，需传给 `/api/v1/chat/text`
- 否则 avatar idle，对话不驱动口型

## SDP 策略

与 Linly 官方 web 客户端一致：客户端 `addTransceiver(audio/video, recvonly)`。
勿在未验证环境下改为 `offerToReceiveAudio/Video`  alone。

## 自检命令

```bash
./scripts/check_webrtc.sh
curl http://localhost:8010/health/full
```

浏览器：`chrome://webrtc-internals`

## 相关文件

| 文件 | 职责 |
|------|------|
| `frontend/src/services/webrtc.ts` | PC / offer / ontrack |
| `frontend/src/hooks/useWebRTC.ts` | 重试 / sessionId / 补绑 |
| `backend/main.py` | `/offer` 代理 |
| `backend/services/linly_client.py` | `/human` 驱动 |
