# ElderTalk — 虚拟真人陪聊 Web 应用

基于 [Linly-Talker-Stream](https://github.com/Kedreamix/Linly-Talker-Stream) 实时数字人技术，面向独居/空巢老人群体的智能陪聊系统。

**在线体验**：https://shuomeng66.github.io/3DAIAvatar/

## 功能概览

- 语音交互：老人通过语音与数字人自然对话，无需打字
- 温暖陪伴：默认女性护工/孙辈形象，语气亲切温和
- 日常陪聊：闲聊、情绪安抚、回忆往事、老歌话题
- 用药提醒：定时提醒老人服药
- 天气播报：每日天气预报
- 全息展示：适配 3D LED 全息风扇屏，数字人跃然空中
- 全双工打断：数字人说话时用户可开口打断
- 声音克隆：上传 1 分钟家属录音 → 自动微调 → 家人声音陪聊
- 数字人定制：上传照片 + 录音 → 生成家人专属数字人

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS 4 + Vite |
| 后端 | Python 3.10 + FastAPI |
| 云函数 | Cloudflare Worker（百炼 LLM + TTS 代理） |
| 实时通信 | WebRTC（aiortc + aiohttp） |
| 数字人引擎 | Linly-Talker-Stream（MuseTalk / Wav2Lip） |
| 大语言模型 | qwen3.5-omni-plus（阿里云百炼） |
| 语音识别 | FunASR / OmniSenseVoice / 浏览器端 Web Speech |
| 语音合成 | CosyVoice / sambert-zhide-v1（百炼）/ Edge TTS |
| 声音克隆 | CosyVoice 3s zero-shot / GPT-SoVITS 微调 |
| 全息推流 | FFmpeg + mediamtx RTSP |
| 部署 | GitHub Pages + Cloudflare Worker / Docker Compose（GPU） |

---

## 部署方式

本项目提供两种部署方式，按需选择：

| 方式 | 适用场景 | 需要 GPU | 数字人 3D 形象 |
|------|----------|----------|---------------|
| 方式一：静态网页 + 云函数 | 快速体验、文字/语音对话 | 否 | 静态形象 |
| 方式二：GPU 服务器完整部署 | 真人 3D 数字人、全息屏 | 是 | 真人 3D |

---

## 方式一：静态网页 + Cloudflare Worker（推荐快速体验）

### 1.1 启用 GitHub Pages

打开 https://github.com/ShuoMeng66/3DAIAvatar/settings/pages

- **Source** 选 **GitHub Actions**
- 等待 Actions 自动构建部署（约 1-2 分钟）
- 访问 `https://shuomeng66.github.io/3DAIAvatar/`

### 1.2 部署 Cloudflare Worker API

```bash
# 进入 Worker 目录
cd workers/elder-talk-api

# 安装依赖
npm install

# 登录 Cloudflare（首次使用）
npx wrangler login

# 设置百炼 API Key（Secret 存储，不会暴露在代码中）
npx wrangler secret put DASHSCOPE_API_KEY
# 输入你的百炼 API Key（从 https://bailian.console.aliyun.com 获取）

# 部署 Worker
npx wrangler deploy
```

部署成功后会输出 Worker URL，例如：
```
https://elder-talk-api.medprep.workers.dev
```

### 1.3 更新前端 API 地址

编辑 `frontend/src/services/config.ts`，将 `WORKER_URL` 改为你的 Worker 地址：

```ts
export const WORKER_URL = 'https://elder-talk-api.你的子域名.workers.dev';
```

然后重新推送代码触发 GitHub Actions 重新构建。

### 1.4 验证部署

访问 Worker 健康检查端点：
```
https://elder-talk-api.你的子域名.workers.dev/api/v1/health
```

应返回：
```json
{"status":"ok","service":"ElderTalk API","model":"qwen3.5-omni-plus","tts_model":"sambert-zhide-v1"}
```

### 1.5 百炼 API Key 申请

1. 访问 https://bailian.console.aliyun.com
2. 开通「模型服务」→ 获取 API Key
3. 免费模型额度充足（有效期到 2099 年）
4. 可用模型：
   - **对话**：qwen3.5-omni-plus（全模态，共情能力强）
   - **语音合成**：sambert-zhide-v1（知德 — 温暖亲切男声）
   - 备用：qwen3.5-omni-flash（更快更轻）、sambert-zhishu-v1

---

## 方式二：GPU 服务器完整部署（含 3D 数字人视频流）

### 2.1 环境要求

| 配置 | 最低 | 推荐 |
|------|------|------|
| GPU | RTX 3060 12GB | RTX 3090/4090 24GB |
| 显存 | 8GB | 16GB+ |
| 内存 | 16GB | 32GB+ |
| 磁盘 | 50GB（模型约 20GB） | 100GB+ |
| 操作系统 | Ubuntu 22.04 | Ubuntu 22.04 |
| CUDA | 12.1+ | 12.1+ |
| Python | 3.10+ | 3.10+ |
| Node.js | 18+ | 20+ |

### 2.2 各模块显存占用

| 模块 | 模型 | 显存 |
|------|------|------|
| ASR | FunASR / OmniSenseVoice | ~1GB |
| LLM | Qwen2.5-7B (INT4) | ~6GB |
| TTS | CosyVoice | ~2GB |
| Avatar | MuseTalk (实时) | ~4GB |
| **总计** | 全部加载 | ~13GB |

> 可通过模型卸载策略减少显存，仅加载当前使用的模块。

### 2.3 租用 GPU 服务器

| 平台 | 配置 | 价格 | 适用场景 |
|------|------|------|----------|
| AutoDL | RTX 3090 24GB | ¥2-4/小时 | 按量付费，适合测试 |
| 阿里云 PAI | V100 32GB | ¥5-10/小时 | 企业级，稳定 |
| 矩池云 | RTX 3080 10GB | ¥1-3/小时 | 性价比高 |
| 本地主机 | RTX 3060 12GB+ | 一次性 | 7×24 长期运行 |

### 2.4 克隆仓库并安装依赖

```bash
# 1. 克隆仓库
git clone https://github.com/ShuoMeng66/3DAIAvatar.git
cd 3DAIAvatar

# 2. 配置环境变量（重要！）
cp .env.example .env
vim .env
```

`.env` 文件需要填入以下内容：

```bash
# ====== 必填 ======
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxx    # 百炼 API Key（LLM 对话）
# ====== 可选 ======
WEATHER_API_KEY=xxxxxxxxxxxxxxxx         # 和风天气 API Key（免费申请：https://devapi.qweather.com）
LLM_API_KEY=sk-xxxxxxxxxxxxxxxx          # DeepSeek API Key（备用 LLM）
# ====== 服务器配置 ======
HOST=0.0.0.0
PORT=8010
FRONTEND_ORIGIN=http://localhost:5173
```

```bash
# 3. 安装系统依赖
sudo apt update
sudo apt install -y ffmpeg python3-pip python3-venv nodejs npm

# 4. 安装 Python 依赖
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. 安装全息模块依赖（可选，需要全息屏输出时安装）
pip install rembg opencv-python aiohttp websockets

# 6. 安装前端依赖
cd ../frontend
npm install
```

### 2.5 下载数字人模型权重

这是最耗时的一步，首次运行会自动下载约 15GB 模型文件。

```bash
# 进入 Linly-Talker-Stream 目录
cd ../third_party/Linly-Talker-Stream

# 安装 Linly-Talker 依赖
pip install -r requirements.txt
```

**手动下载模型（推荐，更稳定）**：

```bash
# 使用 HuggingFace 镜像（国内网络友好）
export HF_ENDPOINT=https://hf-mirror.com

# 下载 MuseTalk 模型（唇形同步）
huggingface-cli download TMElyralab/MuseTalk --local-dir pretrained_models/MuseTalk

# 下载 FunASR 模型（语音识别）
huggingface-cli download iic/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-pytorch --local-dir pretrained_models/FunASR

# 下载 CosyVoice 模型（语音合成，约 1.2GB）
huggingface-cli download FunAudioLLM/CosyVoice-300M --local-dir pretrained_models/CosyVoice-300M
```

### 2.6 下载数字人形象素材

```bash
# 从 Pixabay 下载 CC0 免费人像照片
# 或使用项目自带的示例图片
cd assets/avatars/

# 手动下载 4 套形象（搜索关键词见 MANIFEST.json）
# 慈祥奶奶：https://pixabay.com/photos/search/elderly%20woman%20smile/
# 慈祥爷爷：https://pixabay.com/photos/search/elderly%20man%20smile/
# 孙女形象：https://pixabay.com/photos/search/young%20woman%20smile%20portrait/
# 护工形象：https://pixabay.com/photos/search/nurse%20smile/

# 下载后放入对应目录，然后运行预处理脚本
cd backend
python scripts/preprocess_avatar.py --input ../assets/avatars/grandma_warm/source.jpg --output ../assets/avatars/grandma_warm/
```

### 2.7 启动服务

**三个终端分别启动：**

终端 1 — Linly-Talker 数字人引擎（端口 8000）：
```bash
cd third_party/Linly-Talker-Stream
python app.py --host 0.0.0.0 --port 8000
```

终端 2 — ElderTalk 后端 API（端口 8010）：
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

终端 3 — 前端开发服务器（端口 5173）：
```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

### 2.8 访问

```
前端页面：    http://YOUR_SERVER_IP:5173
API 文档：    http://YOUR_SERVER_IP:8010/docs
Linly-Talker：http://YOUR_SERVER_IP:8000
```

### 2.9 Docker 一键部署（GPU）

```bash
# 使用 GPU 版 Dockerfile
docker compose -f docker-compose.yml up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

---

## 声音克隆模块

### 3.1 模块概述

支持三种克隆引擎：

| 引擎 | 需要音频 | 需要 GPU | 效果 | 使用场景 |
|------|----------|----------|------|----------|
| CosyVoice 3s | 1-5 秒 | 否 | 好 | 快速体验 |
| GPT-SoVITS | 1 分钟+ | 是 | 最好 | 家人声音定制 |
| Edge TTS | 无需 | 否 | 一般 | 快速测试 |

### 3.2 CosyVoice 3 秒零样本克隆（推荐）

```bash
# 1. 准备 1-5 秒清晰录音（WAV 格式，16kHz，单声道）
# 2. 调用 API
curl -X POST http://localhost:8010/api/v1/voice/clone \
  -F "audio=@my_voice.wav" \
  -F "voice_name=家人的声音" \
  -F "engine=cosyvoice"

# 返回 voice_id，后续使用
# {"status": "ok", "voice_id": "cosyvoice_a1b2c3d4", "name": "家人的声音"}
```

### 3.3 GPT-SoVITS 微调（效果最好）

```bash
# 1. 准备 1 分钟以上录音 + 对应文字内容
# 2. 调用 API
curl -X POST http://localhost:8010/api/v1/voice/clone \
  -F "audio=@long_recording.wav" \
  -F "voice_name=家人的声音" \
  -F "engine=gpt_sovits" \
  -F "reference_text=录音的文字内容"

# 3. 在 GPU 服务器上手动运行训练
# 训练脚本在 backend/voice_clone/__init__.py 的 clone_gpt_sovits() 方法中
# 约 30 分钟（RTX 3060）
```

### 3.4 Edge TTS 快速测试（免 GPU）

```bash
# 无需上传音频，直接调用
curl -X POST http://localhost:8010/api/v1/voice/clone \
  -F "voice_name=测试声音" \
  -F "engine=edge_tts"
```

### 3.5 管理声音

```bash
# 列出所有声音
curl http://localhost:8010/api/v1/voice/list

# 使用指定声音合成
curl -X POST http://localhost:8010/api/v1/voice/tts \
  -H "Content-Type: application/json" \
  -d '{"voice_id":"cosyvoice_a1b2c3d4","text":"你好，我是小暖，今天过得怎么样？"}'
```

---

## 全息屏输出模块

### 4.1 全息视频转换

将数字人视频转换为全息屏专用格式（正方形、黑底、人物居中）：

```bash
# 基本转换
python -m hologram.converter avatar_video.mp4 -o hologram.mp4 -r 512

# 高清版本
python -m hologram.converter avatar_video.mp4 -o hologram_hd.mp4 -r 1024

# 使用 rembg 自动抠图（需 GPU）
python -m hologram.converter avatar_video.mp4 -o hologram_rembg.mp4 --rembg

# 查看视频信息
python -m hologram.converter --info avatar_video.mp4
```

### 4.2 RTSP 实时推流

```bash
# 1. 启动 mediamtx RTSP 服务器
docker run -d --network=host bluenviron/mediamtx

# 2. 开始推流
python -m hologram.streamer rtsp avatar_video.mp4 --url rtsp://localhost:8554/hologram

# 3. 测试播放
ffplay -rtsp_transport tcp rtsp://localhost:8554/hologram

# 或使用 VLC 播放
vlc rtsp://localhost:8554/hologram
```

### 4.3 TF 卡导出模式

```bash
python -m hologram.streamer watch avatar_video.mp4 --dir /mnt/tfcard/ --chunk 30
```

### 4.4 全息屏设备兼容性

详见 [HOLOGRAM_DEVICES.md](HOLOGRAM_DEVICES.md)，支持三种设备类型：

| 类型 | 连接方式 | 适配器 |
|------|----------|--------|
| TF 卡播放型 | TF 卡拷贝 | GenericMP4Device |
| WiFi APP 控制型 | HTTP API 上传 | HologramFanAppDevice |
| HDMI/RTSP 流媒体型 | RTSP 推流 | HDMIRTSPDevice |

---

## 素材体系

### 5.1 素材清单

所有素材的下载来源、许可证、使用方法详见各自的 MANIFEST.json：

| 素材 | 清单文件 | 数量 |
|------|----------|------|
| 数字人形象 | [assets/avatars/MANIFEST.json](assets/avatars/MANIFEST.json) | 4 套 |
| 声音模型 | [assets/voices/MANIFEST.json](assets/voices/MANIFEST.json) | 4 套 |
| 动画特效 | [assets/animations/MANIFEST.json](assets/animations/MANIFEST.json) | 5 种 |
| 陪聊话题库 | [assets/topics/companion_topics.json](assets/topics/companion_topics.json) | 150 条 |

### 5.2 下载数字人形象

从 Pixabay 下载 CC0 免费人像（可商用，无需署名）：

```
慈祥奶奶：https://pixabay.com/photos/search/elderly%20woman%20smile/
慈祥爷爷：https://pixabay.com/photos/search/elderly%20man%20smile/
孙女形象：https://pixabay.com/photos/search/young%20woman%20smile%20portrait/
护工形象：https://pixabay.com/photos/search/nurse%20smile/
```

图片要求：正面或微侧、光线均匀、自然微笑、≥512×512、背景简洁。

### 5.3 素材替换

详见 [ASSETS.md](ASSETS.md)，包含：
- 如何替换数字人形象
- 如何替换声音
- 如何添加新话题
- 如何添加动画
- 家属定制端到端流程
- 许可证说明

---

## 目录结构

```
ElderTalk/
├── frontend/                    # 前端 React SPA
│   ├── src/
│   │   ├── components/          # UI 组件
│   │   │   ├── AvatarPlayer.tsx      # WebRTC 视频播放器
│   │   │   ├── VoiceButton.tsx       # 语音录制按钮
│   │   │   ├── SubtitleBar.tsx       # 大字幕（28px）
│   │   │   └── ChatHistory.tsx       # 最近聊天记录
│   │   ├── hooks/               # 自定义 Hooks
│   │   │   ├── useConversationState.ts  # 五态对话状态机
│   │   │   ├── useVAD.ts              # 语音活动检测
│   │   │   ├── useWebRTC.ts           # WebRTC 连接管理
│   │   │   └── useIdleTimer.ts        # 空闲检测
│   │   ├── pages/               # 页面
│   │   │   ├── ChatPage.tsx           # 对话页（主页面）
│   │   │   ├── SettingsPage.tsx       # 家属设置（密码保护）
│   │   │   └── HologramPage.tsx       # 全息屏控制
│   │   ├── services/            # API 服务层
│   │   │   ├── config.ts              # API 地址配置
│   │   │   ├── api.ts                 # 后端 API 调用
│   │   │   ├── bargein.ts             # 打断管理器
│   │   │   └── webrtc.ts              # WebRTC 信令
│   │   ├── App.tsx               # 路由入口
│   │   └── main.tsx              # 应用入口
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                     # 后端 API 网关
│   ├── routers/                 # 路由模块
│   │   ├── chat.py                  # 对话路由
│   │   ├── avatar.py                # 数字人形象管理
│   │   ├── session.py               # 会话历史
│   │   ├── interrupt.py             # 打断控制
│   │   ├── stream.py                # SSE 流式输出
│   │   └── voice_clone.py           # 声音克隆
│   ├── services/                # 业务服务
│   │   ├── llm_adapter.py           # LLM 适配器（含流式）
│   │   ├── stream_adapter.py        # Linly-Talker HTTP 代理
│   │   ├── companion.py             # 陪聊增强（情绪/重复/提醒/天气）
│   │   └── weather.py               # 和风天气 API
│   ├── voice_clone/             # 声音克隆模块
│   │   └── __init__.py              # 三引擎克隆管理
│   ├── data/                    # 数据文件
│   │   └── classic_songs.json       # 经典老歌列表
│   ├── scripts/                 # 工具脚本
│   │   └── preprocess_avatar.py     # 数字人形象预处理
│   ├── prompts/                 # System Prompt
│   │   └── elder_companion.txt      # 小暖角色设定
│   ├── main.py                   # FastAPI 入口
│   ├── config.py                 # 配置管理
│   ├── requirements.txt
│   └── Dockerfile
│
├── workers/                     # Cloudflare Worker
│   └── elder-talk-api/
│       ├── src/index.ts              # 百炼 API 代理
│       ├── wrangler.toml
│       └── package.json
│
├── hologram/                    # 全息屏适配模块
│   ├── converter.py                 # 视频转换管道
│   ├── streamer.py                  # 三模式推流（RTSP/WS/Watch）
│   └── devices/                     # 设备适配层
│       ├── generic_mp4.py           # TF 卡导出
│       ├── hologram_fan_app.py      # WiFi APP HTTP 上传
│       └── hdmi_rtsp.py             # RTSP 推流
│
├── assets/                      # 素材资源
│   ├── avatars/                 # 数字人形象
│   │   ├── MANIFEST.json
│   │   ├── grandma_warm/        # 慈祥奶奶
│   │   ├── grandpa_kind/        # 慈祥爷爷
│   │   ├── young_girl/          # 孙女小暖
│   │   └── caregiver/           # 护工志愿者
│   ├── voices/                  # 声音模型
│   │   ├── MANIFEST.json
│   │   ├── reference/           # 参考音频
│   │   └── custom/              # 自定义克隆声音
│   ├── animations/              # 动画素材
│   │   ├── MANIFEST.json
│   │   └── idle_breathing.css   # 呼吸/眨眼/倾听/说话/打断
│   └── topics/                  # 陪聊话题库
│       └── companion_topics.json  # 100首老歌+50条问候
│
├── scripts/                     # 工具脚本
│   ├── record_demo.sh           # 演示录制（Linux/macOS）
│   └── record_demo.ps1          # 演示录制（Windows）
│
├── .github/workflows/           # GitHub Actions
│   └── deploy.yml               # 自动部署到 GitHub Pages
│
├── docker-compose.yml           # Docker 编排
├── PERFORMANCE.md               # 性能指标与延迟优化
├── HOLOGRAM.md                  # 全息屏适配规范 + 部署建议
├── HOLOGRAM_DEVICES.md          # 全息屏设备兼容性
├── ASSETS.md                    # 素材替换指南
├── FRONTEND.md                  # 前端技术文档
├── BACKEND.md                   # 后端接口文档
├── PROJECT.md                   # 项目架构文档
└── README.md                    # 本文件
```

---

## 对话状态机

前端实现了五态对话状态机，实现「像真人一样聊天」的全双工体验：

```
IDLE → LISTENING → THINKING → SPEAKING → IDLE
                   ↑                      ↓
                   └── INTERRUPTING ←─────┘ (用户打断)
```

- **IDLE**：待机，等待用户开口
- **LISTENING**：正在听取用户语音
- **THINKING**：LLM 推理中
- **SPEAKING**：数字人正在说话
- **INTERRUPTING**：用户打断，停止播放

打断逻辑：数字人说话时 → VAD 检测到用户开口 → 发送 `POST /api/v1/interrupt` → 停止 TTS/Avatar → 切换到 LISTENING。

---

## API 端点一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/health` | 健康检查 |
| POST | `/api/v1/chat/text` | 文字对话 |
| POST | `/api/v1/chat/voice` | 语音对话（上传音频） |
| POST | `/api/v1/chat/stream` | SSE 流式对话 |
| POST | `/api/v1/tts` | 语音合成 |
| POST | `/api/v1/interrupt` | 打断当前对话 |
| GET | `/api/v1/interrupt/status` | 查询打断状态 |
| POST | `/api/v1/voice/clone` | 声音克隆 |
| GET | `/api/v1/voice/list` | 列出所有声音 |
| POST | `/api/v1/voice/tts` | 使用指定声音合成 |
| GET | `/api/v1/avatar/list` | 列出数字人形象 |
| POST | `/api/v1/avatar/select` | 选择数字人形象 |
| GET | `/api/v1/session/{id}/history` | 会话历史 |

完整文档见 [BACKEND.md](BACKEND.md)

---

## 常见问题

### Q: 没有 GPU 能用吗？
可以。使用方式一（GitHub Pages + Cloudflare Worker），通过百炼 API 驱动对话，只是没有真人 3D 数字人视频流。

### Q: 如何申请百炼 API Key？
访问 https://bailian.console.aliyun.com → 开通模型服务 → 生成 API Key。免费额度充足（有效期到 2099 年）。

### Q: 如何申请和风天气 API Key？
访问 https://devapi.qweather.com → 注册 → 创建应用 → 获取 API Key（免费版每天 1000 次调用）。

### Q: 模型下载太慢怎么办？
使用 HuggingFace 镜像：`export HF_ENDPOINT=https://hf-mirror.com`，或使用 ModelScope 下载：`pip install modelscope && python -c "from modelscope import snapshot_download; snapshot_download('iic/CosyVoice-300M')"`。

### Q: 全息屏设备怎么选？
参见 [HOLOGRAM_DEVICES.md](HOLOGRAM_DEVICES.md)，推荐 TF 卡播放型（最便宜，约 200-500 元）。

### Q: 如何替换数字人形象？
参见 [ASSETS.md](ASSETS.md)，从 Pixabay 下载 CC0 人像 → 放入对应目录 → 运行预处理脚本。

### Q: 如何克隆家人的声音？
参见 [声音克隆模块](#声音克隆模块)，上传 1-5 秒录音 → 调用 API → 获得 voice_id。

---

## 许可证

MIT License

## 致谢

- [Linly-Talker](https://github.com/Kedreamix/Linly-Talker) - 数字人对话系统
- [Linly-Talker-Stream](https://github.com/Kedreamix/Linly-Talker-Stream) - 实时流式数字人框架
- [MuseTalk](https://github.com/TMElyralab/MuseTalk) - 实时唇形同步
- [CosyVoice](https://github.com/FunAudioLLM/CosyVoice) - 语音合成
- [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) - 少样本声音克隆
- [FunASR](https://github.com/alibaba-damo-academy/FunASR) - 语音识别
- [阿里云百炼](https://bailian.console.aliyun.com) - 大语言模型 + TTS API
- [和风天气](https://devapi.qweather.com) - 天气 API
- [mediamtx](https://github.com/bluenviron/mediamtx) - RTSP 服务器