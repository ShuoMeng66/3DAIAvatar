# 老人友好 Web 前端 Spec

## Why
基于 Session 0-1 已完成的 monorepo 骨架和后端 API 网关，需要构建面向老人的语音交互前端。老人群体对复杂 UI 容忍度低，需要极简交互、大字体大按钮、语音优先的设计。

## What Changes
- 重构 `frontend/` 为完整 SPA 应用（React + TypeScript + Vite + Tailwind）
- 新增三个页面：主对话页 `/chat`、家属设置页 `/settings`（密码保护）、全息预览页 `/hologram`
- 集成 WebRTC 数字人视频流播放
- 集成语音交互（按住说话 / 打字发送）
- 添加圆润中文字体（思源黑体 CDN）
- 添加图标库（Lucide React）
- 实现空闲自动问候（30 秒无操作）
- 编写 `frontend/DESIGN.md` 设计文档和 `FRONTEND.md` 前端文档

## Impact
- Affected specs: elder-talk-scaffold（前端骨架重构）
- Affected code: `frontend/` 全部文件

## ADDED Requirements

### Requirement: 主对话页 /chat
系统 SHALL 提供老人友好的极简对话页面，核心操作仅 3 个：按住说话、打字发送、停止。

#### Scenario: 页面布局
- **WHEN** 老人打开首页
- **THEN** 看到数字人视频区（占屏幕 60%）、大字幕栏、底部 3 个操作按钮，无复杂菜单

#### Scenario: 空闲自动问候
- **WHEN** 老人 30 秒无任何操作
- **THEN** 系统自动播放问候语「爷爷/奶奶，我在呢，想聊点什么？」

### Requirement: 家属设置页 /settings
系统 SHALL 提供密码保护（默认 123456）的家属设置页，支持数字人形象上传、声音克隆上传、老人称呼设置、提醒事项 CRUD、LLM 人设微调。

#### Scenario: 密码保护
- **WHEN** 访问 /settings
- **THEN** 弹出密码输入框，输入正确密码后进入设置页

### Requirement: 全息预览页 /hologram
系统 SHALL 提供全息屏预览与推送页面，展示黑底正方形数字人视频预览。

#### Scenario: 预览展示
- **WHEN** 进入 /hologram
- **THEN** 看到黑底正方形视频预览区、推送按钮（占位）

### Requirement: 老人友好 UI 规范
系统 SHALL 严格遵守以下无障碍规范：
- 最小字号 20px，按钮高度 ≥ 64px
- 高对比度：浅暖色背景 + 深色文字
- 主操作不超过 3 个按钮
- 无复杂菜单、无弹窗骚扰
- 使用圆润中文字体（思源黑体）
- 温暖浅橙/米色渐变背景，无花哨动画

### Requirement: 核心组件
系统 SHALL 提供以下核心组件：
- `AvatarPlayer`：WebRTC 接收并渲染数字人视频流
- `VoiceButton`：按住说话/松开发送，支持 Web Speech API 和 MediaRecorder
- `SubtitleBar`：大字号实时字幕显示
- `ChatHistory`：简化历史（最近 5 条）

### Requirement: 后端对接
系统 SHALL 对接后端 API：
- WebRTC：POST /offer 建立 PeerConnection
- 文字对话：POST /api/v1/chat/text
- 语音识别：POST /asr（上传 wav）
- 健康检查：GET /health（每 30s 心跳）

### Requirement: 家属设置功能
家属设置页 SHALL 提供以下功能（占位实现，后续完善）：
- 数字人形象上传（图片文件 → 后端 SadTalker 预处理）
- 声音克隆上传（1 分钟 wav → GPT-SoVITS）
- 老人称呼设置（爷爷/奶奶/自定义）
- 提醒事项 CRUD（存 localStorage）
- LLM 人设微调（textarea）

### Requirement: 前端文档
系统 SHALL 提供 `frontend/DESIGN.md`（设计参考与理念）和 `FRONTEND.md`（前端技术文档）。