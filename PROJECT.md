# ElderTalk 项目架构文档

## 目录结构

```
ElderTalk/
├── frontend/                    # 前端 React SPA
│   ├── public/                  # 静态资源
│   ├── src/
│   │   ├── components/          # 可复用组件
│   │   │   ├── VoiceButton.tsx   # 语音录制按钮（麦克风权限请求、录音状态）
│   │   │   ├── ChatBubble.tsx    # 对话气泡（区分用户/数字人消息）
│   │   │   └── AvatarDisplay.tsx # 数字人视频显示区（WebRTC 视频流渲染）
│   │   ├── hooks/               # 自定义 Hooks（待实现）
│   │   │   ├── useWebRTC.ts      # WebRTC 连接管理
│   │   │   ├── useSpeech.ts      # 浏览器语音识别
│   │   │   └── useChat.ts        # 对话状态管理
│   │   ├── services/            # API 服务层（待实现）
│   │   │   ├── api.ts            # 后端 API 调用
│   │   │   └── webrtc.ts         # WebRTC 信令
│   │   ├── App.tsx               # 主页面组件
│   │   ├── main.tsx              # 入口文件
│   │   └── index.css             # 全局样式
│   ├── index.html                # HTML 模板
│   ├── vite.config.ts            # Vite 配置
│   ├── tailwind.config.ts        # Tailwind 配置（可选）
│   ├── tsconfig.json             # TypeScript 配置
│   └── package.json              # 前端依赖
│
├── backend/                     # 后端 API 网关
│   ├── routers/                  # 路由模块（待实现）
│   │   ├── chat.py               # /chat 对话路由
│   │   ├── webrtc.py             # /offer WebRTC 信令路由
│   │   └── hologram.py           # /hologram 全息路由
│   ├── services/                 # 业务服务（待实现）
│   │   ├── llm_client.py         # LLM API 客户端
│   │   ├── tts_client.py         # TTS API 客户端
│   │   └── hologram_encoder.py   # 全息视频编码
│   ├── main.py                   # FastAPI 应用入口
│   ├── config.py                 # 环境变量配置
│   ├── requirements.txt          # Python 依赖
│   └── Dockerfile                # Docker 镜像
│
├── hologram/                    # 全息屏适配模块
│   ├── generate_hologram.py      # 全息视频生成脚本
│   └── README.md                 # 模块说明
│
├── docker-compose.yml            # Docker Compose 编排
├── .env.example                  # 环境变量模板
├── .gitignore                    # Git 忽略规则
├── README.md                     # 项目说明
├── PROJECT.md                    # 本文件
└── HOLOGRAM.md                   # 全息屏适配规范
```

## 模块划分

### frontend（前端）
- **职责**：老人友好的语音交互界面
- **技术栈**：React 18 + TypeScript + Tailwind CSS 4 + Vite
- **关键组件**：
  - VoiceButton：语音输入按钮，麦克风权限请求，录音状态可视化
  - ChatBubble：对话气泡，大字号渲染用户和数字人对话
  - AvatarDisplay：WebRTC 视频流播放，数字人形象渲染
- **设计原则**：
  - 大字体（≥18px），大按钮（≥48px 高度）
  - 暖色系配色（米色背景 #FFF8F0，暖橙色主色 #F59E0B）
  - 语音优先，文字为辅
  - 高对比度，无障碍设计

### backend（后端）
- **职责**：API 网关，连接前端与 Linly-Talker-Stream
- **技术栈**：Python 3.10 + FastAPI + Uvicorn
- **核心端点**：
  - `/health`：健康检查
  - `/offer`：WebRTC SDP 信令代理
  - `/chat`：LLM 对话代理
  - `/hologram`：全息视频生成
- **扩展方向**（待实现）：
  - 用药提醒定时任务（Celery/APScheduler）
  - 天气查询集成（和风天气 API）
  - 对话历史存储（SQLite/Redis）

### hologram（全息适配）
- **职责**：视频后处理，适配 3D LED 全息风扇屏
- **技术栈**：Python + FFmpeg
- **核心功能**：
  - 居中裁剪为正方形
  - 纯黑背景替换
  - H.264 编码输出
  - RTSP 实时推流

### Linly-Talker-Stream（外部集成）
- **职责**：实时数字人推理引擎
- **仓库**：https://github.com/Kedreamix/Linly-Talker-Stream
- **核心模块**：
  - ASR：语音识别（FunASR / OmniSenseVoice）
  - LLM：大语言模型对话（Qwen2.5-7B）
  - TTS：语音合成（CosyVoice / Edge TTS）
  - Avatar：数字人驱动（MuseTalk / Wav2Lip）
- **通信方式**：WebRTC（POST /offer 信令）

## 端口规划

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发服务器 | 5173 | Vite dev server |
| 后端 API 网关 | 8010 | FastAPI + Uvicorn |
| Linly-Talker-Stream | 8010 | 数字人推理引擎（与后端同端口部署时复用） |
| 前端 Nginx（生产） | 80/443 | 静态文件 + API 反向代理 |

## 环境要求

### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| GPU | NVIDIA RTX 3060 12GB | NVIDIA RTX 4090 24GB |
| 显存 | 8GB | 16GB+ |
| 内存 | 16GB | 32GB+ |
| 磁盘 | 50GB（模型文件约 20GB） | 100GB+ |

### 各模块显存估算

| 模块 | 模型 | 显存占用 |
|------|------|----------|
| ASR | FunASR / OmniSenseVoice | ~1GB |
| LLM | Qwen2.5-7B-Instruct (INT4) | ~6GB |
| TTS | CosyVoice | ~2GB |
| Avatar | MuseTalk (实时) | ~4GB |
| Avatar | SadTalker (高质量回放) | ~3GB |
| **总计** | **全部加载** | **~13GB（推荐 16GB+）** |

> 注：可通过模型卸载策略减少显存占用，如仅加载当前使用的模块。

### 软件要求

- Python 3.10+
- Node.js 18+
- CUDA 11.8+ / 12.1+
- Docker 24+（可选）
- NVIDIA Container Toolkit（Docker GPU 支持）

## 数据流

```
用户语音 → 浏览器 Web Speech API / 后端 ASR
         → 文本输入
         → LLM 生成回复文本
         → TTS 合成语音
         → Avatar 驱动数字人视频
         → WebRTC 推送至浏览器
         → 可选：全息后处理 → RTSP → 全息风扇屏
```

## 对话场景设计

| 场景 | 触发方式 | 系统行为 |
|------|----------|----------|
| 日常陪聊 | 用户主动说话 | 闲聊式回复，语气亲切 |
| 用药提醒 | 定时任务 | 主动播报："张奶奶，该吃药了" |
| 天气播报 | 每日定时 / 用户询问 | 查询天气API，播报天气 |
| 往事回忆 | 用户触发 | 引导回忆，共情回应 |
| 情绪安抚 | 检测到负面情绪 | 安抚性话语，转移注意力 |