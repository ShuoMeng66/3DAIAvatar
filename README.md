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

### 环境要求

- Python 3.10+
- Node.js 18+
- GPU：NVIDIA 显卡，显存 ≥ 8GB（推荐 16GB+）
- 操作系统：Ubuntu 22.04（推荐） / Windows 11

### 本地开发

```bash
# 1. 克隆仓库
git clone <repo-url> && cd ElderTalk

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DASHSCOPE_API_KEY 等

# 3. 启动后端
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8010 --reload

# 4. 启动前端（新终端）
cd frontend
npm install
npm run dev

# 5. 打开浏览器
# 前端：http://localhost:5173
# 后端 API 文档：http://localhost:8010/docs
```

### Docker 部署

```bash
docker compose up -d
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
