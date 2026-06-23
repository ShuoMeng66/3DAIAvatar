# Checklist: 后端与 Linly-Talker-Stream 集成

- [x] `third_party/Linly-Talker-Stream/` 存在，仓库完整克隆
- [x] `scripts/download_models.sh` 存在，包含 ModelScope 优先 + HuggingFace fallback
- [x] `scripts/download_models.ps1` 存在（Windows 兼容）
- [x] `backend/routers/chat.py` 存在，提供 POST /api/v1/chat/text 和 POST /api/v1/chat/voice
- [x] `backend/routers/avatar.py` 存在，提供 GET /api/v1/avatar/list 和 POST /api/v1/avatar/select
- [x] `backend/routers/session.py` 存在，提供 GET /api/v1/session/{id}/history
- [x] `backend/main.py` 注册了所有新路由，保留原有端点
- [x] `backend/prompts/elder_companion.txt` 存在，内容覆盖所有规则（口语化、短句、主动关心等）
- [x] `backend/services/llm_adapter.py` 存在，封装 LLM 调用（含 System Prompt 加载）
- [x] `backend/services/stream_adapter.py` 存在，封装 Linly-Talker-Stream API 代理（含 /humanaudio）
- [x] `backend/config.py` 更新，包含 LLM、TTS、ASR、Avatar 配置项
- [x] `assets/avatars/default/` 存在，包含 2-3 张 CC0 人像图片
- [x] `assets/avatars/default/README.md` 存在，说明图片来源和版权
- [x] `Dockerfile.gpu` 存在，基于 CUDA 12.1
- [x] `docker-compose.yml` 更新，backend 服务使用 Dockerfile.gpu，挂载 models 卷
- [x] `BACKEND.md` 存在，包含所有端点文档和请求/响应示例
- [x] `tests/test_webrtc.html` 存在，可在浏览器中测试 WebRTC 连接
- [x] 所有文档和代码注释使用中文