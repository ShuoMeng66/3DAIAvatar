"""
对话路由模块
提供文字对话和语音对话接口。
"""

from fastapi import APIRouter, Request, UploadFile, File, Form
from typing import Optional

router = APIRouter(prefix="/api/v1/chat", tags=["对话"])


@router.post("/text")
async def chat_text(request: Request):
    """
    文字对话接口
    接收用户输入文字，返回 LLM 生成的回复。
    
    请求体:
    {
        "text": "你好",
        "session_id": "session_123"
    }
    
    响应:
    {
        "reply": "您好，我是小暖，今天过得怎么样？",
        "session_id": "session_123",
        "status": "ok"
    }
    """
    body = await request.json()
    text = body.get("text", "")
    session_id = body.get("session_id", "default")
    
    # 占位实现：后续接入真实 LLM 对话逻辑
    return {
        "reply": f"您好，我是小暖，您说的「{text}」我听到了。",
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
    
    请求: multipart/form-data
    - audio: wav 音频文件
    - session_id: 会话 ID
    
    响应:
    {
        "text": "识别到的文字",
        "reply": "LLM 回复文字",
        "audio_url": "/api/v1/audio/response_xxx.wav",
        "session_id": "session_123",
        "status": "ok"
    }
    """
    # 占位实现：后续接入真实 ASR + LLM + TTS 逻辑
    audio_content = await audio.read()
    return {
        "text": "（语音识别占位）",
        "reply": "您好，我是小暖，我听到了您的声音。",
        "audio_url": "",
        "session_id": session_id,
        "status": "ok",
    }