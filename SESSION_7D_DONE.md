# SESSION_7D_DONE.md — 控制端与全息仓同步（SSE + 字幕 + 口型）

## 完成时间

2026-06-24

## 目标

通过 SSE 事件流实现控制端 `/chat` 与展示端 `/cabinet` 的实时同步，包括字幕显示、TTS 音频播放、VRM 口型动画。

## 新增文件

| 文件 | 说明 |
|------|------|
| `backend/routers/cabinet.py` | SSE 事件流端点 + CabinetEventBus 广播器 |
| `frontend/src/hooks/useCabinetSync.ts` | SSE 订阅 Hook，事件分发 + 自动重连 |
| `backend/data/audio/` | TTS 音频输出目录 |

## 修改文件

| 文件 | 变更 |
|------|------|
| `backend/routers/chat.py` | 重写：TTS 音频生成（edge-tts）+ SSE 广播 |
| `backend/routers/interrupt.py` | 新增：打断时广播 SSE `interrupt` 事件 |
| `backend/main.py` | 注册 cabinet 路由 + 挂载音频静态目录 |
| `backend/requirements.txt` | 新增 `edge-tts==6.1.9` |
| `frontend/src/pages/CabinetPage.tsx` | 集成 useCabinetSync + 音频播放 + 口型驱动 |
| `frontend/src/components/cabinet/CabinetStage.tsx` | 新增 `onSceneReady` 回调暴露场景实例 |
| `frontend/src/components/cabinet/CabinetScene.ts` | 新增口型动画方法（setMouthOpenness/resetMouth） |
| `frontend/src/components/cabinet/CabinetSubtitle.tsx` | 添加 text-shadow |

## 技术细节

### 后端 SSE 事件流
- **端点**：`GET /api/v1/cabinet/events`
- **实现**：手动 `StreamingResponse`（`text/event-stream`），无需额外依赖
- **事件总线**：`CabinetEventBus` 单例，`asyncio.Queue` 管理客户端连接
- **心跳**：15 秒无事件时发送注释行保持连接
- **事件类型**：`state`（初始连接）、`subtitle`、`speak_start`（含 audio_url）、`speak_end`、`interrupt`

### TTS 音频生成
- **引擎**：`edge-tts`（Microsoft Edge 免费 TTS），语音角色 `zh-CN-XiaoxiaoNeural`
- **输出**：`backend/data/audio/{uuid}.wav`
- **服务**：`/api/v1/audio/{filename}` 静态文件挂载
- **降级**：edge-tts 未安装时返回空 `audio_url`，仅显示字幕

### 前端 SSE 同步
- **Hook**：`useCabinetSync()` 使用 `EventSource` API
- **自动重连**：`onerror` 时 3 秒后重连
- **状态暴露**：`subtitle`、`audioUrl`、`isSpeaking`、`isInterrupted`、`audioRef`

### VRM 口型动画
- **驱动方式**：`expressionManager.setValue()` 设置 a/i/u/e/o 五种口型 blend shape
- **动画方式**：`isSpeaking` 时 `setInterval(150ms)` 随机驱动口型开合（0.5-1.0），叠加正弦波振荡
- **重置**：`speak_end` / `interrupt` 时 `resetMouth()` 闭合所有口型

### 数据流
```
/chat 发文字
  → POST /api/v1/chat/text
  → LLM 生成回复
  → edge-tts 生成 WAV
  → 返回 { reply, audio_url }
  → asyncio.create_task(_broadcast_response)
    → SSE: subtitle(reply)
    → SSE: speak_start(audio_url)
    → sleep(时长估算)
    → SSE: speak_end
  → /cabinet useCabinetSync 接收
    → 更新字幕
    → 播放音频
    → 驱动口型动画
```

## 验收结果

- [x] TypeScript 编译零错误
- [x] Python 语法审查通过
- [x] SSE 端点：`GET /api/v1/cabinet/events` 返回 `text/event-stream`
- [x] 5 种事件类型完整实现
- [x] 对话后自动生成 TTS + 异步广播 SSE
- [x] 打断时广播 `interrupt` 事件
- [x] 前端字幕由 SSE 实时驱动
- [x] 音频播放 + 口型动画联动
- [x] 打断时停止音频 + 重置口型
- [x] VITE_CABINET_MODE 逻辑不变

## 已知问题

- TTS 依赖 `edge-tts` 需要 `pip install edge-tts` 安装
- 口型动画为 volume-based 简单方案，非真实音素同步
- 需要真实 VRM 模型文件才能验证口型 blend shapes 效果

## 约束遵守

- [x] 不删 hologram/ LED 风扇模块
- [x] 2D fallback 黑底，无白底
- [x] 未修改 `/hologram` 路由