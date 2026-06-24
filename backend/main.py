"""
ElderTalk API 服务入口
提供健康检查、WebRTC 信令代理、LLM 对话代理、全息视频生成等接口。
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from config import settings
from routers import chat, avatar, session, interrupt, stream, voice_clone, cabinet

import httpx

# 创建 FastAPI 应用实例
app = FastAPI(title="ElderTalk API", version="0.1.0")

# 配置 CORS 中间件，允许前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由模块
app.include_router(chat.router)
app.include_router(avatar.router)
app.include_router(session.router)
app.include_router(interrupt.router)
app.include_router(stream.router)
app.include_router(voice_clone.router)
app.include_router(cabinet.router)

# 挂载静态文件目录（/assets 路径映射到 assets/ 目录）
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

# 挂载音频文件目录（TTS 生成的音频）
from pathlib import Path
audio_dir = Path(__file__).parent / "data" / "audio"
audio_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/v1/audio", StaticFiles(directory=str(audio_dir)), name="audio")


# ==================== 健康检查 ====================

@app.get("/health")
async def health_check():
    """健康检查端点，返回服务状态"""
    return {"status": "ok", "service": "ElderTalk API"}


# ==================== WebRTC 信令代理 ====================

@app.post("/offer")
async def webrtc_offer(request: Request):
    """
    WebRTC 信令代理端点
    接收前端 SDP offer，转发到 Linly-Talker-Stream，返回 SDP answer。
    """
    body = await request.json()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.LINLY_STREAM_URL}/offer",
                json=body,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            return JSONResponse(content=resp.json(), status_code=resp.status_code)
    except httpx.ConnectError:
        return JSONResponse(
            status_code=503,
            content={
                "error": "Linly-Talker-Stream 未启动",
                "status": "unavailable",
            },
        )
    except httpx.TimeoutException:
        return JSONResponse(
            status_code=504,
            content={
                "error": "Linly-Talker-Stream 响应超时",
                "status": "timeout",
            },
        )
    except Exception as e:
        return JSONResponse(
            status_code=502,
            content={
                "error": f"Linly-Talker-Stream 代理错误: {str(e)}",
                "status": "error",
            },
        )


# ==================== LLM 对话代理 ====================

@app.post("/chat")
async def chat(request: Request):
    """
    LLM 对话代理端点（占位）
    接收用户消息与对话历史，返回占位回复。
    """
    body = await request.json()
    # 占位：后续接入真实 LLM 对话逻辑
    return {
        "reply": "您好，我是小暖，有什么可以帮您的？",
        "status": "placeholder",
    }


# ==================== 全息视频生成 ====================

@app.post("/hologram")
async def hologram(request: Request):
    """
    全息视频生成端点（占位）
    接收文本与数字人角色，返回占位视频地址。
    """
    body = await request.json()
    # 占位：后续接入真实视频生成逻辑
    return {
        "video_url": "",
        "status": "placeholder",
    }


# ==================== 启动入口 ====================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )