"""
全息仓 SSE 事件流路由
提供控制端与展示端之间的实时同步。
"""

import asyncio
import json
import logging
import uuid
from typing import Dict, Set

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/cabinet", tags=["全息仓同步"])


# ============================================================
# CabinetEventBus — 进程内事件广播器
# ============================================================

class CabinetEventBus:
    """单例事件总线，管理 SSE 客户端连接并广播事件"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._clients: Dict[str, asyncio.Queue] = {}
            cls._instance._lock = asyncio.Lock()
        return cls._instance

    async def add_client(self, client_id: str) -> asyncio.Queue:
        """注册新的 SSE 客户端"""
        queue: asyncio.Queue = asyncio.Queue()
        async with self._lock:
            self._clients[client_id] = queue
        logger.info(f"SSE 客户端已连接: {client_id}, 当前客户端数: {len(self._clients)}")
        return queue

    async def remove_client(self, client_id: str):
        """移除断开连接的客户端"""
        async with self._lock:
            self._clients.pop(client_id, None)
        logger.info(f"SSE 客户端已断开: {client_id}, 当前客户端数: {len(self._clients)}")

    async def broadcast(self, event: str, data: dict):
        """向所有已连接的客户端广播事件"""
        message = f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
        async with self._lock:
            dead_clients = []
            for cid, queue in self._clients.items():
                try:
                    queue.put_nowait(message)
                except asyncio.QueueFull:
                    dead_clients.append(cid)
            for cid in dead_clients:
                self._clients.pop(cid, None)

    @property
    def client_count(self) -> int:
        return len(self._clients)


# 全局单例
event_bus = CabinetEventBus()


# ============================================================
# SSE 端点
# ============================================================

@router.get("/events")
async def cabinet_events(request: Request):
    """
    SSE 事件流端点
    全息仓展示页通过此端点订阅实时事件。
    """

    client_id = str(uuid.uuid4())[:8]
    queue = await event_bus.add_client(client_id)

    async def event_generator():
        # 发送初始 state 事件
        yield f"event: state\ndata: {json.dumps({'status': 'connected', 'client_id': client_id})}\n\n"

        try:
            while True:
                # 检查客户端是否断开
                if await request.is_disconnected():
                    break

                try:
                    message = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield message
                except asyncio.TimeoutError:
                    # 发送心跳保持连接
                    yield ": heartbeat\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            await event_bus.remove_client(client_id)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============================================================
# 便捷广播函数（供其他模块调用）
# ============================================================

async def broadcast_subtitle(text: str):
    """广播字幕更新"""
    await event_bus.broadcast("subtitle", {"text": text})


async def broadcast_speak_start(audio_url: str, text: str = ""):
    """广播开始播放 TTS"""
    await event_bus.broadcast("speak_start", {"audio_url": audio_url, "text": text})


async def broadcast_speak_end():
    """广播播放结束"""
    await event_bus.broadcast("speak_end", {})


async def broadcast_interrupt():
    """广播打断信号"""
    await event_bus.broadcast("interrupt", {"action": "stop"})