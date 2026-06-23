# ElderTalk 虚拟真人陪聊 Web 应用 Spec

## Why
面向独居/空巢老人群体，构建一个基于 Linly-Talker-Stream 实时数字人技术的陪聊 Web 应用。老年用户通过语音与数字人自然交互，数字人以温暖亲切的中老年陪伴形象（默认女性护工/孙辈）进行对话，涵盖日常陪聊、用药提醒、天气播报、往事回忆、情绪安抚等场景。

## What Changes
- 创建 ElderTalk monorepo 项目骨架（前端 + 后端 + 全息适配）
- 集成 Linly-Talker-Stream 作为后端实时数字人引擎（WebRTC + 流式管道）
- 前端：React + TypeScript + Tailwind，老人友好 UI（大字体、大按钮、语音为主）
- 全息屏适配：输出黑底正方形半身像视频，适配 3D LED 全息风扇屏
- 输出 PROJECT.md、HOLOGRAM.md、README.md、docker-compose.yml、.env.example
- **本 Session 仅做架构和脚手架，不实现业务逻辑**

## Impact
- Affected specs: 无（全新项目）
- Affected code: 整个 `d:\WebGame` 工作区（全新创建）

## ADDED Requirements

### Requirement: Monorepo 项目骨架
系统 SHALL 提供完整的 monorepo 目录结构，包含前端、后端、全息适配模块，以及 Docker 部署配置。

#### Scenario: 开发者查看项目结构
- **WHEN** 开发者 clone 仓库后执行 `ls`
- **THEN** 可以看到 `frontend/`、`backend/`、`hologram/`、`docker-compose.yml`、`.env.example`、`README.md`、`PROJECT.md`、`HOLOGRAM.md` 等目录和文件

### Requirement: 老人友好前端脚手架
系统 SHALL 提供基于 React + TypeScript + Tailwind CSS 的前端骨架，预置大字体、大按钮、语音交互优先的设计基调。

#### Scenario: 前端开发服务器启动
- **WHEN** 开发者进入 `frontend/` 目录执行 `npm run dev`
- **THEN** 前端开发服务器在 `http://localhost:5173` 启动，显示占位页面

#### Scenario: 老人友好 UI 基调
- **WHEN** 开发者查看前端入口页面
- **THEN** 页面使用大字号（≥18px）、大按钮（≥48px 高度）、高对比度配色、语音为主要交互方式的设计

### Requirement: 后端 API 网关骨架
系统 SHALL 提供基于 Python FastAPI 的后端骨架，作为前端与 Linly-Talker-Stream 之间的 API 网关。

#### Scenario: 后端服务启动
- **WHEN** 开发者进入 `backend/` 目录执行启动命令
- **THEN** FastAPI 服务在 `http://localhost:8010` 启动，提供 `/health` 健康检查端点

### Requirement: 全息屏适配规范
系统 SHALL 在 HOLOGRAM.md 中定义全息风扇屏视频输出规范，并在 `hologram/` 目录提供适配脚本骨架。

#### Scenario: 全息规范文档可读
- **WHEN** 开发者打开 HOLOGRAM.md
- **THEN** 可以看到分辨率（512×512/1024×1024）、背景（纯黑 #000000）、编码格式（MP4 H.264 25-30fps）、推送方式（TF 卡/WiFi APP/RTSP）等完整规范

### Requirement: Docker Compose 部署骨架
系统 SHALL 提供 docker-compose.yml 占位文件，定义前端 Nginx、后端 API、GPU 推理服务三个容器。

#### Scenario: Docker Compose 配置可读
- **WHEN** 开发者打开 docker-compose.yml
- **THEN** 可以看到 `frontend`、`backend`、`linly-stream` 三个服务定义，含端口映射和卷挂载占位

### Requirement: 文档交付
系统 SHALL 提供中文 README.md、PROJECT.md（目录结构/模块划分/端口规划/环境要求）、HOLOGRAM.md（全息屏适配规范）。

#### Scenario: 文档完整
- **WHEN** 开发者打开各文档
- **THEN** README.md 包含项目简介和快速开始指引；PROJECT.md 包含完整目录结构、模块划分、端口规划、GPU 显存要求；HOLOGRAM.md 包含全息屏适配规范