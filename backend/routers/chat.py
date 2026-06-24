"""
对话路由模块
提供文字对话和语音对话接口。
对话完成后自动生成 TTS 音频并通过 SSE 广播到全息仓。
"""

import asyncio
import os
import uuid
import logging
from typing import Optional

from fastapi import APIRouter, Request, UploadFile, File, Form

from routers.cabinet import (
    broadcast_subtitle,
    broadcast_speak_start,
    broadcast_speak_end,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["对话"])

# 音频输出目录
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)


async def _generate_tts(text: str) -> str:
    """
    生成 TTS 音频文件，返回 audio_url。
    降级方案：使用 edge-tts 生成 WAV 文件。
    """
    filename = f"{uuid.uuid4().hex[:12]}.wav"
    filepath = os.path.join(AUDIO_DIR, filename)

    try:
        import edge_tts  # type: ignore

        communicate = edge_tts.Communicate(text, "zh-CN-XiaoxiaoNeural")
        await communicate.save(filepath)
        logger.info(f"TTS 音频已生成: {filepath}")
        return f"/api/v1/audio/{filename}"
    except ImportError:
        logger.warning("edge-tts 未安装，跳过 TTS 生成")
        return ""
    except Exception as e:
        logger.error(f"TTS 生成失败: {e}")
        return ""


async def _broadcast_response(reply: str, audio_url: str):
    """广播对话响应到全息仓 SSE 客户端"""
    # 1. 广播字幕
    await broadcast_subtitle(reply)

    if audio_url:
        # 2. 广播开始播放（含音频 URL）
        await broadcast_speak_start(audio_url, reply)

        # 3. 模拟播放结束（按文本长度估算时长，约 4 字/秒）
        estimated_duration = max(2.0, len(reply) / 4.0)
        await asyncio.sleep(estimated_duration)
        await broadcast_speak_end()
    else:
        # 无音频时，字幕显示 5 秒后清空
        await asyncio.sleep(5.0)
        await broadcast_speak_end()


@router.post("/text")
async def chat_text(request: Request):
    """
    文字对话接口
    接收用户输入文字，返回 LLM 生成的回复 + TTS 音频 URL。
    """
    body = await request.json()
    text = body.get("text", "")
    session_id = body.get("session_id", "default")

    # 占位 LLM 回复（后续接入真实 LLM）
    reply = f"您好，我是小暖，您说的「{text}」我听到了。"

    # 生成 TTS 音频
    audio_url = await _generate_tts(reply)

    # 异步广播 SSE 事件（不阻塞响应）
    asyncio.create_task(_broadcast_response(reply, audio_url))

    return {
        "reply": reply,
        "audio_url": audio_url,
        "session_id": session_id,
        "status": "ok",
    }


@router.post("/voice")
async def chat_voice(
    audio: UploadFile = File(...),
    session_id: str = Form(default="default"),
):
    """
    语音对话接口
    上传 wav 音频文件，经过 ASR → LLM → TTS 返回回复。
    """
    audio_content = await audio.read()

    # 占位 ASR + LLM 回复（后续接入真实逻辑）
    reply = "您好，我是小暖，我听到了您的声音。"

    # 生成 TTS 音频
    audio_url = await _generate_tts(reply)

    # 异步广播 SSE 事件
    asyncio.create_task(_broadcast_response(reply, audio_url))

    return {
        "text": "（语音识别占位）",
        "reply": reply,
        "audio_url": audio_url,
        "session_id": session_id,
        "status": "ok",
    }