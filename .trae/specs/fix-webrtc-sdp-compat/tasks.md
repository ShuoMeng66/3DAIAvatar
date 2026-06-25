# Tasks

- [x] Task 1: 修复 `webrtc.ts` SDP 兼容性
  - [x] 移除 `addTransceiver('audio', ...)` 和 `addTransceiver('video', ...)`（第 60-61 行）
  - [x] 替换为 `createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })`
  - [x] 更新注释：移除「addTransceiver」相关描述
  - **验证**：TypeScript 编译通过

- [x] Task 2: 修复 `useWebRTC.ts` 重复连接问题
  - [x] 新增 `connectingRef`（useRef），在 `connect()` 开始时设为 true，完成/失败后设为 false
  - [x] `connect()` 开头检查 `connectingRef.current || connectionState === 'connected'`，若为 true 则 return
  - **验证**：TypeScript 编译通过

- [x] Task 3: 更新 `HOLOGRAM_CABINET.md` 远程部署文档
  - [x] 在「故障排查」章节前新增「远程部署注意事项」小节
  - [x] 说明 SSH 隧道仅转发 TCP，WebRTC 需要 UDP 直连
  - [x] 说明 AutoDL 需映射 8000 端口（公网）才能远程 WebRTC
  - [x] 说明本机测试（AutoDL 内浏览器访问）不受影响
  - **验证**：文档格式正确

- [x] Task 4: TypeScript 编译验证
  - [x] `npx tsc --noEmit` 零错误
  - **验证**：编译通过

# Task Dependencies
- Task 1, 2, 3 可并行执行
- Task 4 依赖 Task 1, 2