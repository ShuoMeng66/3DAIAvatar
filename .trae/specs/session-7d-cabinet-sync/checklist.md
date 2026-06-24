# Checklist: Session 7D — 控制端与全息仓同步（SSE + 字幕 + 口型）

## Backend SSE
- [x] `cabinet.py` 中 `GET /api/v1/cabinet/events` 返回 SSE 流
- [x] `CabinetEventBus` 单例支持事件广播
- [x] 事件类型：`subtitle`、`speak_start`、`speak_end`、`interrupt`、`state`
- [x] 初始连接发送 `state` 事件
- [x] 客户端断开时清理连接（15s 心跳超时）

## Backend Chat 修改
- [x] 对话完成后生成 TTS 音频（edge-tts 降级）
- [x] 音频保存到 `backend/data/audio/`
- [x] 响应 JSON 包含 `audio_url` 字段
- [x] 广播 `subtitle` SSE 事件（回复文本）
- [x] 广播 `speak_start` SSE 事件（含 `audio_url`）
- [x] 广播 `speak_end` SSE 事件（按时长估算）

## Backend Interrupt 修改
- [x] 打断时广播 `interrupt` SSE 事件

## Backend 路由注册
- [x] `main.py` 注册 `cabinet` 路由
- [x] `backend/data/audio/` 目录存在
- [x] `/api/v1/audio` 静态文件挂载

## Frontend useCabinetSync
- [x] `EventSource` 连接 `/api/v1/cabinet/events`
- [x] 解析 `subtitle` 事件并更新文本
- [x] 解析 `speak_start` 事件并设置 audioUrl
- [x] 解析 `speak_end` 事件并清空状态
- [x] 解析 `interrupt` 事件并停止
- [x] SSE 断开时自动重连（3 秒间隔）
- [x] 暴露 `subtitle`、`audioUrl`、`isSpeaking`、`isInterrupted`、`audioRef`
- [x] 组件卸载时关闭 EventSource

## Frontend CabinetSubtitle
- [x] 字幕文字有 `text-shadow` 样式
- [x] 字体 ≥36px，白色 `#ffffff`

## Frontend CabinetScene 口型
- [x] `setMouthOpenness(value)` 方法存在
- [x] `resetMouth()` 方法存在
- [x] 口型驱动使用 VRM blend shapes（a/i/u/e/o）
- [x] 正弦波振荡模拟口型变化
- [x] `start()` 时自动启动口型动画循环

## Frontend CabinetPage 集成
- [x] 集成 `useCabinetSync` hook
- [x] 字幕由 SSE 实时驱动
- [x] audioUrl 播放时自动设置 src 并 play
- [x] 播放时 setInterval 驱动口型随机开合
- [x] interrupt 时停止音频 + 重置口型
- [x] VITE_CABINET_MODE 逻辑不变
- [x] CabinetStage 通过 onSceneReady 暴露场景

## 依赖
- [x] `backend/requirements.txt` 新增 `edge-tts`
- [x] SSE 手动实现（StreamingResponse），无需 `sse-starlette`

## 约束
- [x] 不删 hologram / LED 风扇模块
- [x] 2D fallback 黑底，无白底
- [x] TypeScript 编译零错误
- [x] Python 语法审查通过

## 文档
- [x] `SESSION_7D_DONE.md` 已创建