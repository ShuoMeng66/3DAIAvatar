# Tasks: 老人友好 Web 前端

- [x] Task 1: 前端项目重构与依赖安装
  - 清理现有占位代码，保留 Vite + React + TypeScript 骨架
  - 安装依赖：react-router-dom（路由）、lucide-react（图标）
  - 安装 Tailwind CSS v4 插件（@tailwindcss/vite）
  - 引入思源黑体 CDN（Noto Sans SC）到 index.html
  - 配置 Tailwind 暖色主题（大字体基础、暖橙色主色、米色背景）

- [x] Task 2: 创建路由与页面框架
  - 安装 react-router-dom，配置 HashRouter（兼容静态部署）
  - 创建三个页面组件：ChatPage、SettingsPage、HologramPage
  - 创建 `components/Layout.tsx`：顶部标题栏 + 内容区 + 底部导航
  - 导航栏仅显示：聊天 / 全息（设置入口隐藏，通过长按标题 3 秒进入）

- [x] Task 3: 实现核心组件
  - 创建 `components/AvatarPlayer.tsx`：WebRTC 视频流播放器，接收远程视频轨道，渲染到 `<video>` 标签
  - 创建 `components/VoiceButton.tsx`：按住说话按钮（64px 圆形），支持 mouse/touch 事件，使用 MediaRecorder 录音，集成 Web Speech API 实时转文字
  - 创建 `components/SubtitleBar.tsx`：大字号字幕栏，显示 AI 回复文字
  - 创建 `components/ChatHistory.tsx`：简化聊天历史（仅显示最近 5 条）

- [x] Task 4: 实现 WebRTC 连接服务
  - 创建 `services/webrtc.ts`：WebRTC 连接管理，创建 PeerConnection，发送 POST /offer 信令，接收远程 SDP answer，处理 ICE 候选
  - 创建 `services/api.ts`：后端 API 调用封装（health check、chat text、asr upload）
  - 创建 `hooks/useWebRTC.ts`：React Hook 封装 WebRTC 连接状态管理
  - 创建 `hooks/useIdleTimer.ts`：30 秒空闲检测，触发自动问候

- [x] Task 5: 实现主对话页 ChatPage
  - 组合 AvatarPlayer + SubtitleBar + VoiceButton + ChatHistory
  - 文字输入模式：底部输入框 + 发送按钮（大字、大按钮）
  - 语音模式：按住 VoiceButton 录音，松开后 POST /asr
  - 集成 useIdleTimer：30 秒无操作自动问候
  - 集成 useWebRTC：页面加载时自动建立 WebRTC 连接

- [x] Task 6: 实现家属设置页 SettingsPage
  - 密码保护：默认密码 123456，输入正确后显示设置内容
  - 老人称呼设置：下拉选择 爷爷/奶奶/自定义 + 自定义输入框
  - 数字人形象上传：文件选择器 + 预览（占位，后续对接后端）
  - 声音克隆上传：文件选择器（wav/mp3，占位）
  - 提醒事项 CRUD：列表展示 + 添加/删除（localStorage 存储）
  - LLM 人设微调：textarea（保存到 localStorage）

- [x] Task 7: 实现全息预览页 HologramPage
  - 黑底正方形视频预览区（512×512）
  - 推送按钮（占位，后续对接后端 /hologram）
  - 状态提示：就绪/生成中/推送成功

- [x] Task 8: 编写前端文档
  - 编写 `frontend/DESIGN.md`：设计参考、老人友好 UI 原则、配色方案、字体选择
  - 编写 `FRONTEND.md`：技术栈、组件树、路由设计、API 对接、构建部署

# Task Dependencies
- Task 2 依赖 Task 1（需先完成基础配置）
- Task 3 依赖 Task 1（需 Tailwind 配置完成）
- Task 4 依赖 Task 1
- Task 5 依赖 Task 2, Task 3, Task 4（需路由、组件、WebRTC 就绪）
- Task 6 依赖 Task 2（需路由框架）
- Task 7 依赖 Task 2
- Task 8 可独立执行

# Parallelizable
- Task 1, Task 8 可并行执行
- Task 2, Task 3, Task 4 在 Task 1 完成后可并行执行
- Task 5, Task 6, Task 7 在 Task 2 完成后可并行执行