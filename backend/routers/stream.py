"""
流式对话路由模块
提供 SSE (Server-Sent Events) 流式输出接口。
"""

import json
import asyncio
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

router = APIRouter(prefix="/api/v1/chat", tags=["流式对话"])


@router.post("/stream")
async def chat_stream(request: Request):
    """
    流式文字对话（SSE）
    接收用户输入文字，流式返回 LLM token。
    
    请求体:
    {
        "text": "你好",
        "session_id": "session_123"
    }
    
    响应 (SSE):
    data: {"token": "您"}
    data: {"token": "好"}
    data: {"token": "，"}
    data: {"token": "我"}
    data: {"token": "是"}
    data: {"token": "小"}
    data: {"token": "暖"}
    data: {"done": true}
    """
    body = await request.json()
    text = body.get("text", "")
    session_id = body.get("session_id", "default")

    async def generate():
        # 占位实现：模拟流式输出
        reply = f"您好，我是颐语，您说的「{text}」我听到了。"
        
        # 逐字输出
        for char in reply:
            data = json.dumps({"token": char}, ensure_ascii=False)
            yield f"data: {data}\n\n"
            await asyncio.sleep(0.03)  # 模拟生成延迟
        
        # 结束标志
        yield f"data: {json.dumps({'done': True})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )