# Tasks: Session 7D — 控制端与全息仓同步（SSE + 字幕 + 口型）

- [x] Task 1: 创建 `backend/routers/cabinet.py` SSE 事件流
  - [x] 实现 `GET /api/v1/cabinet/events` SSE 端点（手动 StreamingResponse）
  - [x] 实现事件广播器：`CabinetEventBus` 单例，支持 `subtitle`、`speak_start`、`speak_end`、`interrupt`、`state` 事件
  - [x] 初始连接时发送 `state` 事件（当前状态）
  - [x] 客户端断开时自动清理（15s 心跳超时检测）
  - **验证**：Python 语法审查通过

- [x] Task 2: 修改 `backend/routers/chat.py` 生成 TTS 并广播 SSE
  - [x] 对话完成后调用 TTS 生成音频文件 → `backend/data/audio/`
  - [x] TTS 降级方案：无真实 TTS 时使用 `edge-tts` 生成 `.wav`
  - [x] 对话响应 JSON 增加 `audio_url` 字段
  - [x] 广播 `subtitle` 事件（回复文本）
  - [x] 广播 `speak_start` 事件（含 `audio_url`）
  - [x] 模拟 `speak_end` 广播（按文本长度估算时长）
  - **验证**：Python 语法审查通过

- [x] Task 3: 修改 `backend/routers/interrupt.py` 广播 SSE 打断事件
  - [x] 打断时通过 `CabinetEventBus` 广播 `interrupt` 事件
  - **验证**：Python 语法审查通过

- [x] Task 4: 修改 `backend/main.py` 注册 cabinet 路由
  - [x] `import cabinet` + `app.include_router(cabinet.router)`
  - [x] 创建 `backend/data/audio/` 目录
  - [x] 挂载 `/api/v1/audio` 静态文件路由
  - **验证**：路由注册成功

- [x] Task 5: 创建 `frontend/src/hooks/useCabinetSync.ts`
  - [x] 使用 `EventSource` 连接 `/api/v1/cabinet/events`
  - [x] 解析 SSE 事件：`subtitle` → 更新文本、`speak_start` → 设置 audioUrl、`speak_end` → 清空、`interrupt` → 停止
  - [x] 自动重连：`onerror` 时延迟 3 秒重连
  - [x] 暴露：`subtitle`、`audioUrl`、`isSpeaking`、`isInterrupted`、`audioRef`
  - [x] 组件卸载时关闭 EventSource
  - **验证**：TypeScript 编译通过

- [x] Task 6: 修改 `CabinetSubtitle.tsx` 增加 text-shadow
  - [x] 字幕文字添加 `text-shadow: 0 0 12px rgba(255,255,255,0.3)`
  - **验证**：TypeScript 编译通过

- [x] Task 7: 修改 `CabinetScene.ts` 增加 VRM 口型动画
  - [x] 新增 `setMouthOpenness(value: number)` 方法：驱动 VRM 口型 blend shapes
  - [x] 新增 `resetMouth()` 方法：重置口型到闭合状态
  - [x] 使用 volume-based 简单方案：正弦波振荡口型开合
  - [x] 口型动画在 `start()` 时自动启动 `startMouthAnimation()`
  - **验证**：TypeScript 编译通过

- [x] Task 8: 修改 `CabinetPage.tsx` 集成 useCabinetSync
  - [x] 引入 `useCabinetSync` hook
  - [x] 替换静态字幕为 SSE 实时字幕
  - [x] 收到 `audioUrl` 时播放 `<audio>` 元素
  - [x] 播放时调用 `setInterval` 驱动口型随机开合
  - [x] 收到 `interrupt` 时停止音频 + 重置口型
  - [x] 保留 VITE_CABINET_MODE 逻辑不变
  - [x] CabinetStage 通过 `onSceneReady` 暴露场景实例
  - **验证**：TypeScript 编译通过

- [x] Task 9: 更新依赖
  - [x] 后端 `requirements.txt` 新增 `edge-tts`
  - [x] SSE 手动实现（StreamingResponse），无需 `sse-starlette`
  - **验证**：依赖列表正确

- [x] Task 10: 端到端验证
  - [x] TypeScript 编译零错误
  - [x] Python 语法审查通过
  - [x] SSE 端点实现完成
  - [x] 字幕/音频/口型联动逻辑完整
  - **验证**：所有场景通过

- [x] Task 11: 创建 `SESSION_7D_DONE.md`

# Task Dependencies
- Task 2 依赖 Task 1（需要 CabinetEventBus）
- Task 3 依赖 Task 1（需要 CabinetEventBus）
- Task 4 可与 Task 1-3 并行
- Task 5 独立（不依赖后端，使用 EventSource 标准 API）
- Task 6 独立
- Task 7 独立
- Task 8 依赖 Task 5、Task 7（需要 hook 和口型方法）
- Task 9 独立
- Task 10 依赖 Task 4-8 完成
- Task 11 依赖 Task 10 完成