"""
ElderTalk API 服务入口
"""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from config import settings
from routers import (
    chat,
    avatar,
    session,
    interrupt,
    stream,
    voice_clone,
    cabinet,
    linly,
)

import httpx
import logging

from services.sdp_rewrite import rewrite_sdp_ice

logger = logging.getLogger(__name__)

app = FastAPI(title="ElderTalk API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(avatar.router)
app.include_router(session.router)
app.include_router(interrupt.router)
app.include_router(stream.router)
app.include_router(voice_clone.router)
app.include_router(cabinet.router)
app.include_router(linly.router)

assets_dir = settings.ASSETS_DIR
if assets_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

audio_dir = Path(__file__).parent / "data" / "audio"
audio_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/v1/audio", StaticFiles(directory=str(audio_dir)), name="audio")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ElderTalk API"}


@app.get("/health/full")
async def health_check_full():
    from services import linly_client

    linly_ok = await linly_client.linly_health()
    return {"backend": True, "linly": linly_ok}


@app.post("/offer")
async def webrtc_offer(request: Request):
    body = await request.json()

    try:
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            resp = await client.post(
                f"{settings.LINLY_STREAM_URL.rstrip('/')}/offer",
                json=body,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.ConnectError:
        return JSONResponse(
            status_code=503,
            content={"error": "Linly-Talker-Stream 未启动", "status": "unavailable"},
        )
    except httpx.TimeoutException:
        return JSONResponse(
            status_code=504,
            content={"error": "Linly-Talker-Stream 响应超时", "status": "timeout"},
        )
    except Exception as e:
        return JSONResponse(
            status_code=502,
            content={"error": f"Linly-Talker-Stream 代理错误: {str(e)}", "status": "error"},
        )

    if not data.get("sdp") or data.get("type") != "answer":
        return JSONResponse(
            status_code=502,
            content={
                "error": "Linly 返回无效 SDP answer",
                "status": "invalid_answer",
                "detail": data,
            },
        )

    public_host = settings.LINLY_ICE_PUBLIC_HOST.strip()
    if public_host:
        data["sdp"] = rewrite_sdp_ice(
            data["sdp"],
            public_host,
            settings.LINLY_ICE_PUBLIC_PORT,
        )
        logger.info(
            "Rewrote SDP ICE candidates to %s:%s",
            public_host,
            settings.LINLY_ICE_PUBLIC_PORT,
        )
    else:
        logger.warning(
            "LINLY_ICE_PUBLIC_HOST unset — SDP ICE candidates not rewritten; "
            "remote browsers may fail to connect video"
        )

    return JSONResponse(content=data, status_code=200)


@app.post("/chat")
async def chat_legacy(request: Request):
    body = await request.json()
    return {
        "reply": "您好，我是颐语，有什么可以帮您的？",
        "status": "placeholder",
    }


@app.post("/hologram")
async def hologram(request: Request):
    await request.json()
    return {"video_url": "", "status": "placeholder"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
