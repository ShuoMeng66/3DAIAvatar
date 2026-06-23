# ElderTalk — 虚拟真人陪聊 Web 应用

基于 [Linly-Talker-Stream](https://github.com/Kedreamix/Linly-Talker-Stream) 实时数字人技术，面向独居/空巢老人群体的智能陪聊系统。

快速体验: https://shuomeng66.github.io/3DAIAvatar/
## 功能概览

- 🎤 **语音交互**：老人通过语音与数字人自然对话，无需打字
- 👩‍⚕️ **温暖陪伴**：默认女性护工/孙辈形象，语气亲切温和
- 💬 **日常陪聊**：闲聊、情绪安抚、回忆往事
- ⏰ **用药提醒**：定时提醒老人服药
- 🌤️ **天气播报**：每日天气预报
- 📺 **全息展示**：适配 3D LED 全息风扇屏，数字人跃然空中

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Tailwind CSS 4 + Vite |
| 后端 | Python 3.10 + FastAPI |
| 实时通信 | WebRTC（aiortc + aiohttp） |
| 数字人引擎 | Linly-Talker-Stream（MuseTalk / Wav2Lip） |
| 大语言模型 | Qwen2.5（阿里云百炼）/ DeepSeek |
| 语音识别 | FunASR / OmniSenseVoice / 浏览器端 Web Speech |
| 语音合成 | CosyVoice（中文女声，语速偏慢） |
| 部署 | Docker Compose（GPU 服务器 + Nginx） |

## 快速开始

### 在线体验（无需部署）

直接访问：https://shuomeng66.github.io/3DAIAvatar/

使用文字对话功能，由百炼 `qwen3.5-omni-plus` 模型驱动。

### 完整部署（含数字人视频流）

> 需要 GPU 服务器运行 Linly-Talker-Stream 实时数字人引擎。

#### 环境要求

- **GPU 服务器**：NVIDIA 显卡，显存 ≥ 8GB（推荐 16GB+，RTX 3060 12GB 起）
- **操作系统**：Ubuntu 22.04（推荐）
- **CUDA**：12.1+
- **Python**：3.10+
- **Node.js**：18+
- **磁盘**：≥ 50GB（模型权重约 20GB）

#### 第一步：租用 GPU 服务器

推荐方案（按需选择）：

| 方案 | 配置 | 参考价格 | 适用场景 |
|------|------|----------|----------|
| AutoDL | RTX 3090 / 24GB | ¥2-4/小时 | 按量付费，适合测试 |
| 阿里云 PAI | V100 / 32GB | ¥5-10/小时 | 企业级，稳定 |
| 矩池云 | RTX 3080 / 10GB | ¥1-3/小时 | 性价比高 |
| 本地主机 | RTX 3060 12GB+ | 一次性投入 | 7×24 长期运行 |

> 注意：Linly-Talker 模型权重首次运行会自动下载（约 15GB），需确保磁盘空间充足。

#### 第二步：克隆仓库并安装依赖

```bash
# 1. 克隆仓库
git clone https://github.com/ShuoMeng66/3DAIAvatar.git
cd 3DAIAvatar

# 2. 配置环境变量
cp .env.example .env
vim .env
# 填入以下配置：
#   DASHSCOPE_API_KEY=xxx        # 百炼 API Key（用于 LLM 对话）
#   LLM_API_KEY=xxx              # 可选的 DeepSeek API Key
#   WEATHER_API_KEY=xxx          # 和风天气 API Key（免费申请）

# 3. 安装系统依赖
sudo apt update
sudo apt install -y ffmpeg python3-pip python3-venv nodejs npm

# 4. 安装 Python 依赖
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. 安装全息模块依赖（可选）
pip install rembg opencv-python aiohttp websockets

# 6. 安装前端依赖
cd ../frontend
npm install
```

#### 第三步：启动 Linly-Talker-Stream 数字人引擎

```bash
# 进入 Linly-Talker-Stream 目录
cd ../third_party/Linly-Talker-Stream

# 安装 Linly-Talker 依赖
pip install -r requirements.txt

# 首次运行会自动下载模型权重（约 15GB，需等待 10-30 分钟）
# 下载的模型：
#   - MuseTalk（唇形同步）
#   - FunASR / OmniSenseVoice（语音识别）
#   - CosyVoice（语音合成）
#   - 默认数字人形象

# 启动数字人服务
python app.py --host 0.0.0.0 --port 8000
```

#### 第四步：启动 ElderTalk 后端

```bash
# 新终端，回到 backend 目录
cd backend
source venv/bin/activate

# 启动 API 服务
uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

#### 第五步：启动前端

```bash
# 新终端
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```

#### 第六步：打开浏览器

```
前端：http://YOUR_SERVER_IP:5173
API 文档：http://YOUR_SERVER_IP:8010/docs
Linly-Talker：http://YOUR_SERVER_IP:8000
```

### Docker 一键部署（GPU）

```bash
# 使用 GPU 版 Dockerfile
docker compose -f docker-compose.yml up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

### 全息视频转换

```bash
# 将数字人视频转换为全息屏格式
python -m hologram.converter avatar_video.mp4 -o hologram.mp4 -r 512

# RTSP 推流到全息屏
python -m hologram.streamer rtsp avatar_video.mp4
```

## 目录结构

```
ElderTalk/
├── frontend/             # 前端 React 应用
│   ├── src/
│   │   ├── components/   # UI 组件
│   │   │   ├── VoiceButton.tsx    # 语音交互按钮
│   │   │   ├── ChatBubble.tsx     # 对话气泡
│   │   │   └── AvatarDisplay.tsx  # 数字人显示区
│   │   ├── App.tsx        # 主页面
│   │   └── index.css      # 全局样式 + Tailwind
│   ├── nginx.conf         # Nginx 配置
│   └── package.json
├── backend/              # 后端 API 网关
│   ├── main.py            # FastAPI 应用入口
│   ├── config.py          # 配置管理
│   ├── requirements.txt   # Python 依赖
│   └── Dockerfile         # 后端 Docker 镜像
├── hologram/             # 全息屏适配模块
│   └── generate_hologram.py  # 全息视频生成脚本
├── docker-compose.yml    # Docker 编排
├── .env.example          # 环境变量模板
├── README.md             # 项目说明
├── PROJECT.md            # 项目架构文档
└── HOLOGRAM.md           # 全息屏适配规范
```

## 许可证

MIT License

## 致谢

- [Linly-Talker](https://github.com/Kedreamix/Linly-Talker) - 数字人对话系统
- [Linly-Talker-Stream](https://github.com/Kedreamix/Linly-Talker-Stream) - 实时流式数字人框架
- [MuseTalk](https://github.com/TMElyralab/MuseTalk) - 实时唇形同步
- [CosyVoice](https://github.com/FunAudioLLM/CosyVoice) - 语音合成
- [FunASR](https://github.com/alibaba-damo-academy/FunASR) - 语音识别
