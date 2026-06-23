# Checklist: ElderTalk 项目脚手架

- [x] 项目根目录存在 frontend/、backend/、hologram/ 三个子目录
- [x] .gitignore 文件存在，正确忽略 node_modules、.venv、__pycache__、模型权重文件
- [x] .env.example 文件存在，包含 DASHSCOPE_API_KEY 等关键环境变量占位
- [x] frontend/ 使用 Vite + React + TypeScript 初始化，`npm run dev` 可启动
- [x] frontend/ 集成 Tailwind CSS，暖色系大字体主题已配置
- [x] frontend/ 入口页面使用大字号（≥18px）、大按钮（≥48px 高度）
- [x] frontend/ 包含 VoiceButton、ChatBubble、AvatarDisplay 三个占位组件
- [x] backend/ 基于 FastAPI，`uvicorn main:app` 可启动
- [x] backend/ 提供 /health 端点返回 `{"status": "ok"}`
- [x] backend/ 提供 /offer、/chat、/hologram 端点占位
- [x] hologram/ 目录存在，含 generate_hologram.py 占位脚本
- [x] HOLOGRAM.md 包含分辨率（512×512/1024×1024）、纯黑背景（#000000）、MP4 H.264 编码、推送方式等规范
- [x] README.md（中文）存在，包含项目简介、技术栈、快速开始指引
- [x] PROJECT.md 存在，包含完整目录结构、模块划分、端口规划（前端 5173/后端 8010/Linly-Stream 8010）、GPU 显存要求
- [x] docker-compose.yml 存在，定义 frontend、backend、linly-stream 三个服务
- [x] frontend/nginx.conf 存在（Nginx 配置占位）
- [x] backend/Dockerfile 存在（后端 Docker 镜像占位）
- [x] 所有文档使用中文撰写，无英文内容