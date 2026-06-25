# Tasks

- [x] Task 1: 修复 `useWebRTC.ts` — Strict Mode 下 connectingRef 不重置导致 connect() 被跳过（核心根因）
  - [x] cleanup 函数中增加 `connectingRef.current = false`
  - [x] catch 分支改为 `console.error('[useWebRTC] connect failed:', err)` 后调用 `handleRetry()`
  - **验证**：React 18 Strict Mode 下 mount 两次后 connect() 仍正常执行

- [x] Task 2: 回退 `webrtc.ts` 到 `addTransceiver` 方案
  - [x] 将 `createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })` 改回 `addTransceiver('audio', { direction: 'recvonly' })` + `addTransceiver('video', { direction: 'recvonly' })` + `createOffer()`
  - [x] 更新注释：流程描述改为 `addTransceiver (audio + video, recvonly)`
  - [x] 在 `sendOffer` 调用前后加 `console.debug('[WebRTC] sending offer...')` 和 `console.debug('[WebRTC] answer received')`
  - [x] 任何错误 `console.error('[WebRTC]', err)` 后 rethrow
  - **验证**：与手动测试逻辑一致

- [x] Task 3: 加固 `api.ts` `sendOffer` 错误处理
  - [x] 增加 `res.ok` 检查，非 200 时 throw 详细错误
  - [x] 删除「仅本地开发环境使用」注释
  - **验证**：HTTP 错误不再静默通过

- [x] Task 4: 修复 `ChatPage.tsx` 状态机 — THINKING → START_SPEAKING 无效转换
  - [x] `handleSendText` 中删除 `startListening()` + `finishListening()` 调用
  - [x] 改为从 IDLE 直接 `startSpeaking()`，并在 `useConversationState.ts` 中 IDLE 状态增加 `START_SPEAKING` 转换
  - **验证**：发送文字后 Console 无「状态机: 从 THINKING 接收 START_SPEAKING 无效」

- [x] Task 5: 修复 `CabinetPage.tsx` 健康检查 URL
  - [x] 将 `http://localhost:8010/health` 改为使用 `API_BASE` 拼接 `/health`
  - **验证**：`/cabinet` 页面不再有 health canceled 错误

- [x] Task 6: TypeScript 编译验证
  - [x] `npx tsc --noEmit` 零错误
  - **验证**：编译通过

# Task Dependencies
- Task 1, 2, 3, 4, 5 可并行执行
- Task 6 依赖 Task 1, 2, 3, 4, 5