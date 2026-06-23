# 后端与 Linly-Talker-Stream 集成 Spec

## Why
基于 Session 0 已搭建的 monorepo 骨架，需要将 Linly-Talker-Stream 完整集成进 ElderTalk 后端，提供老人陪聊功能。需要克隆、安装依赖、配置模型、封装 REST API 接口，并准备默认数字人素材。

## What Changes
- 克隆 Linly-Talker-Stream 仓库到 `third_party/` 目录
- 编写一键脚本下载模型权重（支持国内镜像：ModelScope）
- 在 `backend/` 扩展 FastAPI：新增 `/api/v1/` REST 接口（文字对话、语音对话、数字人管理、对话历史）
- 添加老人陪聊 System Prompt 到 `backend/prompts/elder_companion.txt`
- 配置默认模型：ASR (OmniSenseVoice) + LLM (Qwen2.5-7B/DeepSeek API) + TTS (CosyVoice 中文女声，rate 0.9) + Avatar (MuseTalk)
- 创建 `Dockerfile.gpu` 和更新 `docker-compose.yml`
- 下载 CC0 授权人像图片 2-3 张作为默认数字人源图放入 `assets/avatars/default/`
- 编写 `BACKEND.md` 接口文档，提供 `test_webrtc.html` 用于 WebRTC 连接测试

## Impact
- Affected specs: elder-talk-scaffold（现有骨架扩展）
- Affected code:
  - `backend/` 目录（新增路由、服务、prompts）
  - 新增 `third_party/Linly-Talker-Stream/` 目录
  - 新增 `assets/avatars/default/` 目录
  - 新增 `scripts/download_models.sh`
  - 更新 `docker-compose.yml`

## ADDED Requirements

### Requirement: Linly-Talker-Stream 克隆与依赖安装
系统 SHALL 在 `third_party/Linly-Talker-Stream/` 克隆官方仓库，并按照官方 README 安装依赖。

#### Scenario: 克隆完成
- **WHEN** 开发者查看 `third_party/Linly-Talker-Stream/`
- **THEN** 仓库完整克隆，包含所有源码和配置文件

### Requirement: 一键模型下载脚本
系统 SHALL 提供 `scripts/download_models.sh` 一键下载脚本，优先使用 ModelScope 国内镜像，支持 fallback 到 HuggingFace。

#### Scenario: 脚本执行
- **WHEN** 开发者执行 `scripts/download_models.sh`
- **THEN** 自动下载 Linly-Talker-Stream 所需 MuseTalk、FunASR/OmniSenseVoice、CosyVoice、Qwen2.5 模型权重到 `models/` 目录

### Requirement: FastAPI REST 接口扩展
系统 SHALL 在现有 `backend/` FastAPI 基础上新增以下端点：
- `POST /api/v1/chat/text` — 文字对话（输入文字，返回数字人响应）
- `POST /api/v1/chat/voice` — 语音对话（上传 wav 文件，返回响应）
- `GET /api/v1/avatar/list` — 列出可选数字人形象列表
- `POST /api/v1/avatar/select` — 切换当前使用的数字人形象
- `GET /api/v1/session/{id}/history` — 获取指定会话的对话历史

#### Scenario: API 可访问
- **WHEN** 客户端请求 `/api/v1/chat/text`，body 为 `{"text": "你好", "session_id": "123"}`
- **THEN** 返回 `{"reply": "...", "session_id": "123", "status": "ok"}`

### Requirement: 老人陪聊 System Prompt
系统 SHALL 在 `backend/prompts/elder_companion.txt` 提供精心设计的 System Prompt，使 LLM 扮演「小暖」角色：
- 耐心温暖，专门陪老人聊天
- 简单口语化中文，句子短，一次不超过 3 句
- 语速感放慢，多用「嗯」「好的」「我听着呢」
- 主动关心：今天吃饭了吗、睡得好吗、天气冷不冷
- 不聊复杂政治、医疗诊断；健康话题只给一般建议并提醒问医生
- 老人重复说话时耐心回应，不纠正
- 可聊老歌、戏曲、广场舞、孙子辈、年轻往事
- 检测到孤独/难过时先共情再转移话题

#### Scenario: Prompt 可读取
- **WHEN** 开发者打开 `backend/prompts/elder_companion.txt`
- **THEN** 可以看到完整符合以上规则的 Prompt 内容

### Requirement: 默认模型配置
系统 SHALL 配置默认模型参数：
- ASR: OmniSenseVoice（中文优先，更快）
- LLM: 可配置 Qwen2.5-7B-Instruct 本地运行，或 DeepSeek API
- TTS: CosyVoice 中文女声，语速 rate = 0.9（偏慢，适合老人）
- Avatar: MuseTalk（实时驱动）

#### Scenario: 配置生效
- **WHEN** 启动服务
- **THEN** 使用默认配置正确加载模块

### Requirement: 默认数字人素材
系统 SHALL 下载 2-3 张 CC0 授权的亚洲中老年女性温暖微笑人像，作为默认数字人源图，放入 `assets/avatars/default/`。

#### Scenario: 素材存在
- **WHEN** 查看 `assets/avatars/default/`
- **THEN** 可以看到 2-3 张 PNG/JPG 人像图片

### Requirement: Docker GPU 支持
系统 SHALL 提供 `Dockerfile.gpu`（基于 CUDA 12.1），并更新 `docker-compose.yml` 中的 `backend`/`linly-stream` 服务定义，支持 GPU 推理。

#### Scenario: 构建可运行
- **WHEN** 开发者执行 `docker compose build backend`
- **THEN** 镜像构建成功，支持 NVIDIA GPU 推理

### Requirement: 文档与测试
系统 SHALL 提供：
- `BACKEND.md`：后端接口文档，包含端点说明、请求/响应示例
- `tests/test_webrtc.html`：简单 HTML 测试页面，用于验证 WebRTC /offer 连接

#### Scenario: 文档完整
- **WHEN** 开发者打开 `BACKEND.md`
- **THEN** 可以看到所有新增端点的完整文档

#### Scenario: WebRTC 测试
- **WHEN** 在浏览器打开 `test_webrtc.html`
- **THEN** 可以尝试连接 WebRTC，显示连接状态

### Requirement: Adapter 模式集成
系统 SHALL 不修改 Linly-Talker-Stream 核心逻辑，通过 adapter 方式集成，保留原有 /offer /human /asr /humanaudio /health 端点。

#### Scenario: 原有端点可用
- **WHEN** 调用 Linly-Talker-Stream 原有端点 `POST /offer`
- **THEN** 端点正常响应，不破坏原有功能