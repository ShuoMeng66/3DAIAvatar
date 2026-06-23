"""
ElderTalk API 服务入口
提供健康检查、WebRTC 信令代理、LLM 对话代理、全息视频生成等接口。
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from routers import chat, avatar, session

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

# 挂载静态文件目录（/assets 路径映射到 assets/ 目录）
app.mount("/assets", StaticFiles(directory="assets"), name="assets")


# ==================== 健康检查 ====================

@app.get("/health")
async def health_check():
    """健康检查端点，返回服务状态"""
    return {"status": "ok", "service": "ElderTalk API"}


# ==================== WebRTC 信令代理 ====================

@app.post("/offer")
async def webrtc_offer(request: Request):
    """
    WebRTC 信令代理端点（占位）
    接收前端 SDP offer，返回占位 answer。
    """
    body = await request.json()
    # 占位：后续接入真实的 WebRTC 信令逻辑
    return {
        "sdp": "",
        "type": "answer",
        "status": "placeholder",
    }


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