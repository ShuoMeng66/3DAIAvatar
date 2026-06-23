# ElderTalk 后端接口文档

## 概述
ElderTalk 后端基于 FastAPI 构建，作为前端与 Linly-Talker-Stream 实时数字人引擎之间的 API 网关。

- 基础 URL: `http://localhost:8010`
- API 文档: `http://localhost:8010/docs`（自动生成 Swagger UI）
- 所有接口返回 JSON 格式

---

## 1. 健康检查

### GET /health
检查服务运行状态。

**响应示例：**
```json
{
  "status": "ok",
  "service": "ElderTalk API"
}
```

---

## 2. WebRTC 信令代理

### POST /offer
WebRTC SDP 信令代理，转发到 Linly-Talker-Stream。

**请求体：**
```json
{
  "sdp": "v=0...",
  "type": "offer"
}
```

**响应示例：**
```json
{
  "sdp": "v=0...",
  "type": "answer",
  "status": "ok"
}
```

---

## 3. LLM 对话代理（基础）

### POST /chat
基础文字对话接口（Session 0 占位实现）。

**请求体：**
```json
{
  "message": "你好",
  "history": []
}
```

**响应示例：**
```json
{
  "reply": "您好，我是小暖，有什么可以帮您的？",
  "status": "placeholder"
}
```

---

## 4. 全息视频生成

### POST /hologram
全息视频生成接口（占位）。

**请求体：**
```json
{
  "text": "你好",
  "avatar": "xiaonuan"
}
```

**响应示例：**
```json
{
  "video_url": "",
  "status": "placeholder"
}
```

---

## 5. 文字对话（v1）

### POST /api/v1/chat/text
新版文字对话接口，支持会话管理。

**请求体：**
```json
{
  "text": "你好",
  "session_id": "session_123"
}
```

**响应示例：**
```json
{
  "reply": "您好，我是小暖，您说的「你好」我听到了。",
  "session_id": "session_123",
  "status": "ok"
}
```

---

## 6. 语音对话（v1）

### POST /api/v1/chat/voice
上传 wav 音频文件，经过 ASR → LLM → TTS 返回回复。

**请求：** multipart/form-data

| 字段 | 类型 | 说明 |
|------|------|------|
| audio | file | wav 音频文件 |
| session_id | string | 会话 ID（可选，默认 "default"）|

**响应示例：**
```json
{
  "text": "（语音识别占位）",
  "reply": "您好，我是小暖，我听到了您的声音。",
  "audio_url": "",
  "session_id": "session_123",
  "status": "ok"
}
```

---

## 7. 数字人形象管理

### GET /api/v1/avatar/list
获取可选数字人形象列表。

**响应示例：**
```json
{
  "avatars": [
    {
      "id": "avatar_01",
      "name": "小暖（默认）",
      "description": "温暖亲切的女性护工形象",
      "preview_url": "/assets/avatars/default/avatar_01.jpg",
      "engine": "musetalk"
    },
    {
      "id": "avatar_02",
      "name": "小暖（备选）",
      "description": "温柔笑容的中年女性形象",
      "preview_url": "/assets/avatars/default/avatar_02.jpg",
      "engine": "musetalk"
    },
    {
      "id": "avatar_03",
      "name": "小暖（经典）",
      "description": "慈祥的老年女性形象",
      "preview_url": "/assets/avatars/default/avatar_03.jpg",
      "engine": "sadtalker"
    }
  ],
  "current": "avatar_01",
  "status": "ok"
}
```

### POST /api/v1/avatar/select
切换当前使用的数字人形象。

**请求体：**
```json
{
  "avatar_id": "avatar_02"
}
```

**成功响应：**
```json
{
  "avatar_id": "avatar_02",
  "status": "ok",
  "message": "已切换为「小暖（备选）」"
}
```

**失败响应：**
```json
{
  "status": "error",
  "message": "未找到形象: avatar_99"
}
```

---

## 8. 会话管理

### GET /api/v1/session/{session_id}/history
获取指定会话的对话历史。

**路径参数：**
| 参数 | 说明 |
|------|------|
| session_id | 会话 ID |

**查询参数：**
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| limit | int | 50 | 返回条数上限 |
| offset | int | 0 | 偏移量 |

**响应示例：**
```json
{
  "session_id": "session_123",
  "messages": [
    {
      "role": "user",
      "content": "你好",
      "time": "2026-06-23T10:00:00"
    },
    {
      "role": "assistant",
      "content": "您好，我是小暖，今天过得怎么样？",
      "time": "2026-06-23T10:00:05"
    }
  ],
  "total": 2,
  "status": "ok"
}
```

---

## Linly-Talker-Stream 原有端点

以下端点为 Linly-Talker-Stream 原生端点，通过 adapter 代理访问：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查（Stream 自身） |
| POST | /offer | WebRTC SDP 信令 |
| POST | /human | 文字对话（type=chat 调用 LLM，type=echo 文字回放） |
| POST | /asr | 上传音频 → ASR → LLM → 驱动数字人说话 |
| POST | /humanaudio | 上传音频文件驱动数字人说话 |
| POST | /record | 开始/停止录音 |
| GET | /download/{filename} | 下载录音文件 |

---

## 环境变量配置

参考 `.env.example`：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| DASHSCOPE_API_KEY | 阿里云百炼 API Key | - |
| LLM_MODEL | LLM 模型名称 | deepseek-chat |
| LLM_API_KEY | LLM API Key | - |
| LLM_BASE_URL | LLM API 地址 | https://api.deepseek.com |
| TTS_ENGINE | TTS 引擎 | cosyvoice |
| TTS_VOICE | TTS 语音角色 | zh-CN-XiaoxiaoNeural |
| TTS_RATE | TTS 语速 | 0.9 |
| ASR_ENGINE | ASR 引擎 | omnisensevoice |
| AVATAR_ENGINE | 数字人引擎 | musetalk |
| STREAM_BASE_URL | Linly-Talker-Stream 地址 | http://localhost:8010 |
| BACKEND_PORT | 后端端口 | 8010 |
| FRONTEND_PORT | 前端端口 | 5173 |