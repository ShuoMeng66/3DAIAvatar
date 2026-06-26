# ElderTalk 前端设计文档

## 设计理念

### 核心原则
1. **极简交互**：老人不应面对复杂操作，核心操作不超过 3 个按钮
2. **视觉优先**：大字体、大按钮、高对比度，确保可读性
3. **语音为主**：默认语音交互，文字输入为辅助
4. **温柔智伴**：Purple Elder Companion 粉紫系，略梦幻、适全息 AI 陪聊
5. **无干扰**：无弹窗、无广告、无复杂菜单

## Purple Elder Companion 色板

整体气质：**粉紫、柔感、科技智伴**（非俗套 AI 紫粉大渐变）。

| 角色 | 色值 | 用途 |
|------|------|------|
| bg-base | #F5F0FF | 页面底（浅薰衣草） |
| bg-soft | #EBE4FF | 渐变底 / 卡片区 |
| primary | #6D28D9 | 主按钮、强调 |
| primary-hover | #5B21B6 | 悬停 |
| primary-light | #A78BFA | 图标、描边 |
| accent | #C4B5FD | 标签、选中态 |
| text-main | #1E1B4B | 主文字 |
| text-muted | #5B5675 | 辅助文字 |
| border | #DDD6FE | 边框 |
| cabinet-bg | #0A0612 | 全息仓纯黑偏紫 |

Tokens 定义见 `src/styles/tokens.css`。

### 对比度
- 文字/背景对比度 ≥ 7:1（正文）
- 白字 on primary 按钮 ≥ 4.5:1

## 字体

- **Noto Sans SC**（Google Fonts）
- 正文 ≥20px、按钮 ≥64px、字幕 ≥28px

## 组件库

`src/components/ui/` — Button、Card、Badge、Input  
预览：`/#/ui-preview`

## 模式

- `VITE_USE_WEBRTC=true`（默认）：WebRTC 数字人视频
- `VITE_USE_WEBRTC=false`：静态形象 + TTS audio_url 简单模式

## 适老约束

- 动画 0.2~0.3s
- `prefers-reduced-motion` 关闭 pulse
