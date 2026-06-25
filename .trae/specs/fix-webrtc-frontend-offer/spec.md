# 修复前端 WebRTC 不发起 /offer 请求

## Why
基础设施（Linly HTTPS、Backend 代理、SSH 隧道 18010→8010）均已验证可用。浏览器 Console 手动 `addTransceiver + createOffer + fetch('/offer')` 返回 200。但应用内 `useWebRTC` → `connectWebRTC` 从未发起 `/offer` 请求，Network 中完全没有 POST /offer。

**根因**：`fix-webrtc-sdp-compat` 引入的 `connectingRef` 在 React 18 Strict Mode 下存在 bug。Strict Mode 会 mount→unmount→mount 两次，cleanup 函数未重置 `connectingRef`，导致第二次 mount 时 `connectingRef.current` 仍为 `true`，`connect()` 直接返回，永不发送 `/offer`。

**次要根因**：`useWebRTC.ts` 的 `catch { handleRetry() }` 静默吞错，即使有异常也看不到任何 Console 报错。

## What Changes
- **BREAKING**: `webrtc.ts` 回退到 `addTransceiver` 方案（与手动测试一致，已验证 200）
- `useWebRTC.ts` 修复 `connectingRef` 在 Strict Mode 下的 bug（cleanup 时重置）
- `useWebRTC.ts` catch 分支加 `console.error`，不再静默吞错
- `webrtc.ts` 加 `console.debug` 打点，确认 `sendOffer` 是否被调用
- `api.ts` `sendOffer` 加 HTTP 状态码检查
- `ChatPage.tsx` 状态机修复：`THINKING → START_SPEAKING` 无效转换
- `CabinetPage.tsx` 健康检查 URL 改为 `/health`

## Impact
- Affected specs: fix-webrtc-sdp-compat（回退部分修改）
- Affected code: `frontend/src/services/webrtc.ts`, `frontend/src/hooks/useWebRTC.ts`, `frontend/src/services/api.ts`, `frontend/src/pages/ChatPage.tsx`, `frontend/src/pages/CabinetPage.tsx`

## MODIFIED Requirements
### Requirement: WebRTC SDP 兼容性
前端 `connectWebRTC()` SHALL 使用 `addTransceiver` 方案（与手动测试一致），而非 `createOffer({ offerToReceiveAudio, offerToReceiveVideo })`。

#### Scenario: WebRTC 信令成功
- **WHEN** 前端加载 `/chat` 页面
- **THEN** Network 中出现 `POST /offer` → 200

### Requirement: 连接重试限流
`useWebRTC` SHALL 在 cleanup 时重置 `connectingRef`，确保 React 18 Strict Mode 下第二次 mount 能正常调用 `connect()`。

#### Scenario: Strict Mode 兼容
- **WHEN** React 18 Strict Mode 触发 mount→unmount→mount
- **THEN** 第二次 mount 时 `connect()` 正常执行，不因 stale `connectingRef` 提前返回

### Requirement: 错误日志
`useWebRTC` 的 catch 分支 SHALL 输出 `console.error`，不再静默吞错。

#### Scenario: 错误可见
- **WHEN** WebRTC 连接失败
- **THEN** Console 显示 `[useWebRTC] connect failed:` + 错误详情

### Requirement: 状态机转换
`ChatPage` 文字发送 SHALL 先 `finishListening` 再 `startSpeaking`，或从 IDLE 直接 `startSpeaking`，避免 `THINKING → START_SPEAKING` 无效转换。

#### Scenario: 文字发送状态转换
- **WHEN** 用户在 IDLE 状态发送文字
- **THEN** 状态转换为 SPEAKING（不经过 THINKING）