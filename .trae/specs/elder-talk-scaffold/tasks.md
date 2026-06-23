# Tasks: ElderTalk 项目脚手架搭建

- [x] Task 1: 创建项目根目录结构
  - 创建 monorepo 顶层目录骨架（frontend/、backend/、hologram/）
  - 创建 .gitignore 文件（忽略 node_modules、.venv、__pycache__、模型文件等）
  - 创建 .env.example 文件（含 DASHSCOPE_API_KEY、TTS 配置、Avatar 配置等占位）

- [x] Task 2: 搭建前端脚手架（frontend/）
  - 使用 Vite + React + TypeScript 初始化项目
  - 安装 Tailwind CSS v4 并配置
  - 创建老人友好 UI 基调的入口页面（App.tsx）：大字号（≥18px）、大按钮（≥48px）、高对比度
  - 配置 Tailwind 主题：大字体基础尺寸、暖色系配色（温馨感）
  - 创建占位组件：VoiceButton（语音按钮）、ChatBubble（对话气泡）、AvatarDisplay（数字人显示区）

- [x] Task 3: 搭建后端骨架（backend/）
  - 创建 Python FastAPI 项目骨架（main.py、requirements.txt）
  - 创建 /health 健康检查端点
  - 创建 WebRTC 信令代理占位（/offer 端点预留）
  - 创建 LLM 对话代理占位（/chat 端点预留）
  - 创建全息视频生成占位（/hologram 端点预留）

- [x] Task 4: 创建全息适配模块（hologram/）
  - 创建 hologram/ 目录及占位脚本（generate_hologram.py）
  - 编写 HOLOGRAM.md 全息屏适配规范文档

- [x] Task 5: 编写项目文档
  - 编写 README.md（中文）：项目简介、技术栈、快速开始、目录结构
  - 编写 PROJECT.md：详细目录结构、模块划分、端口规划、GPU 显存要求

- [x] Task 6: 创建 Docker 部署骨架
  - 创建 docker-compose.yml：定义 frontend（Nginx）、backend（FastAPI）、linly-stream（GPU 推理）三个服务
  - 创建 frontend/nginx.conf（前端 Nginx 配置占位）
  - 创建 backend/Dockerfile（后端 Docker 镜像占位）

# Task Dependencies
- Task 2 依赖 Task 1（需先创建根目录结构）
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1
- Task 5 依赖 Task 1
- Task 6 依赖 Task 1, Task 2, Task 3

# Parallelizable
- Task 2, Task 3, Task 4, Task 5 可并行执行（均依赖 Task 1 完成后）
- Task 6 需等待 Task 2 和 Task 3 完成后执行