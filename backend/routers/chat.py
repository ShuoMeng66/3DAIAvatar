"""
对话路由模块
提供文字对话和语音对话接口。
对话完成后自动生成 TTS 音频并通过 SSE 广播到全息仓。
Linly session 可用时优先驱动 WebRTC 数字人。
"""

import asyncio
import os
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Request, UploadFile, File, Form

from config import settings
from routers.cabinet import (
    broadcast_subtitle,
    broadcast_speak_start,
    broadcast_speak_end,
)
from services.llm_adapter import get_llm_adapter
from services import linly_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["对话"])

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)


def _llm_config() -> dict:
    return {
        "api_key": settings.LLM_API_KEY,
        "model": settings.LLM_MODEL,
        "base_url": settings.LLM_BASE_URL,
    }


async def _generate_tts(text: str) -> str:
    filename = f"{uuid.uuid4().hex[:12]}.wav"
    filepath = os.path.join(AUDIO_DIR, filename)

    try:
        import edge_tts  # type: ignore

        communicate = edge_tts.Communicate(text, settings.TTS_VOICE)
        await communicate.save(filepath)
        logger.info("TTS 音频已生成: %s", filepath)
        return f"/api/v1/audio/{filename}"
    except ImportError:
        logger.warning("edge-tts 未安装，跳过 TTS 生成")
        return ""
    except Exception as e:
        logger.error("TTS 生成失败: %s", e)
        return ""


async def _broadcast_response(
    reply: str,
    audio_url: str,
    *,
    linly_driven: bool = False,
):
    await broadcast_subtitle(reply)

    if linly_driven:
        await broadcast_speak_start("", reply, linly_driven=True)
        estimated_duration = max(2.0, len(reply) / 4.0)
        await asyncio.sleep(estimated_duration)
        await broadcast_speak_end()
        return

    if audio_url:
        await broadcast_speak_start(audio_url, reply, linly_driven=False)
        estimated_duration = max(2.0, len(reply) / 4.0)
        await asyncio.sleep(estimated_duration)
        await broadcast_speak_end()
    else:
        await asyncio.sleep(5.0)
        await broadcast_speak_end()


async def _resolve_reply(
    text: str,
    linly_session_id: Optional[int],
    history: Optional[list],
) -> tuple[str, bool]:
    """返回 (reply, driven_by_linly)"""
    if linly_session_id is not None and linly_session_id > 0:
        try:
            reply = await linly_client.send_human_chat(linly_session_id, text)
            return reply, True
        except Exception as e:
            logger.warning("Linly 驱动失败，降级 LLM: %s", e)

    adapter = get_llm_adapter(_llm_config())
    if adapter:
        result = adapter.chat(text, history=history)
        return result.get("reply", "嗯，我听到了。"), False

    return f"您好，我是颐语。您说的「{text}」我听到了。", False


@router.post("/text")
async def chat_text(request: Request):
    body = await request.json()
    text = body.get("text", "")
    session_id = body.get("session_id", "default")
    history = body.get("history")
    linly_session_id = body.get("linly_session_id")

    reply, driven_by_linly = await _resolve_reply(text, linly_session_id, history)
    audio_url = "" if driven_by_linly else await _generate_tts(reply)

    asyncio.create_task(
        _broadcast_response(reply, audio_url, linly_driven=driven_by_linly)
    )

    return {
        "reply": reply,
        "audio_url": audio_url,
        "session_id": session_id,
        "linly_session_id": linly_session_id,
        "driven_by_linly": driven_by_linly,
        "status": "ok",
    }


@router.post("/voice")
async def chat_voice(
    audio: UploadFile = File(...),
    session_id: str = Form(default="default"),
    linly_session_id: Optional[int] = Form(default=None),
):
    await audio.read()

    reply, driven_by_linly = await _resolve_reply(
        "（语音消息）",
        linly_session_id,
        None,
    )
    audio_url = "" if driven_by_linly else await _generate_tts(reply)

    asyncio.create_task(
        _broadcast_response(reply, audio_url, linly_driven=driven_by_linly)
    )

    return {
        "text": "（语音识别占位）",
        "reply": reply,
        "audio_url": audio_url,
        "session_id": session_id,
        "linly_session_id": linly_session_id,
        "driven_by_linly": driven_by_linly,
        "status": "ok",
    }
