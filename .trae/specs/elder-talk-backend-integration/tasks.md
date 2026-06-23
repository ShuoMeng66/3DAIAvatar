# Tasks: 后端与 Linly-Talker-Stream 集成

- [x] Task 1: 克隆 Linly-Talker-Stream 仓库
  - 创建 `third_party/` 目录
  - git clone `https://github.com/Kedreamix/Linly-Talker-Stream` 到 `third_party/Linly-Talker-Stream`
  - 检查仓库完整性（README.md、pyproject.toml、src/ 等关键文件存在）

- [x] Task 2: 编写模型下载脚本
  - 创建 `scripts/download_models.sh`，支持 bash 和 PowerShell `download_models.ps1`
  - 优先使用 ModelScope（modelscope.cn）下载
  - 下载目标：MuseTalk 权重、OmniSenseVoice 模型、CosyVoice 模型、Qwen2.5-7B-Instruct（或对应 API 配置说明）
  - 每个模型下载含国内镜像 fallback（ModelScope → HuggingFace 镜像 → 官方源）
  - 创建 `scripts/` 目录（如不存在）

- [x] Task 3: 扩展 backend/ FastAPI 路由
  - 创建 `backend/routers/` 目录及模块
  - `backend/routers/chat.py`：POST /api/v1/chat/text、POST /api/v1/chat/voice
  - `backend/routers/avatar.py`：GET /api/v1/avatar/list、POST /api/v1/avatar/select
  - `backend/routers/session.py`：GET /api/v1/session/{id}/history
  - 更新 `backend/main.py`，注册新路由，保留原有 /offer /chat /hologram /health 端点
  - 所有端点返回占位实现（后续 Session 接入真实逻辑），返回格式符合 JSON 规范

- [x] Task 4: 编写老人陪聊 System Prompt
  - 创建 `backend/prompts/` 目录
  - 编写 `backend/prompts/elder_companion.txt`：角色设定「小暖」，内容覆盖所有规则（口语化、短句、主动关心、避免政治/医疗诊断、耐心回应重复、老歌/戏曲/孙子辈话题、情绪安抚）

- [x] Task 5: 创建 LLM adapter 服务
  - 创建 `backend/services/llm_adapter.py`：LLM 客户端，读取 System Prompt，封装 LLM 调用（支持 DeepSeek API / 本地 Qwen）
  - 创建 `backend/services/stream_adapter.py`：Linly-Talker-Stream adapter 封装，代理 POST /offer /human /asr /humanaudio 调用
  - 更新 `backend/config.py`，添加 LLM 模型、TTS 语音、Avatar 类型等配置项

- [x] Task 6: 下载默认数字人素材
  - 搜索 Unsplash/Pexels 获取 2-3 张 CC0 亚洲中老年女性温暖微笑人像
  - 创建 `assets/avatars/default/` 目录
  - 下载图片并保存
  - 创建 `assets/avatars/default/README.md` 说明图片来源和版权

- [x] Task 7: 创建 Docker 部署文件
  - 创建 `Dockerfile.gpu`（基于 nvidia/cuda:12.1.0-runtime-ubuntu22.04）
  - 更新 `docker-compose.yml`：backend 服务使用 `Dockerfile.gpu`，挂载 models 卷，添加 GPU 支持
  - 更新 `backend/Dockerfile`（非 GPU 版本保留）

- [x] Task 8: 编写文档和测试
  - 编写 `BACKEND.md`：所有端点文档（/health, /offer, /human, /asr, /humanaudio, /api/v1/chat/text, /api/v1/chat/voice, /api/v1/avatar/list, /api/v1/avatar/select, /api/v1/session/{id}/history）
  - 编写 `tests/test_webrtc.html`：简单 HTML 页面，用 JavaScript WebRTC API 测试后端 /offer 端点

# Task Dependencies
- Task 2 依赖 Task 1（需先克隆仓库才能知道要下载哪些模型）
- Task 3 依赖 Task 1（需参考 Stream 的 API 设计实现路由）
- Task 5 依赖 Task 1, Task 4（需 Stream 仓库和 System Prompt）
- Task 7 可独立执行
- Task 8 依赖 Task 3（需路由实现完成后编写文档）

# Parallelizable
- Task 1, Task 4, Task 6, Task 7 可并行执行
- Task 2, Task 3, Task 5 在 Task 1 完成后可并行执行
- Task 8 在 Task 3 完成后执行