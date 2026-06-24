"""
打断路由模块
提供数字人播放打断接口，并广播 SSE 打断事件到全息仓。
"""

from fastapi import APIRouter
from typing import Dict
import logging

from routers.cabinet import broadcast_interrupt

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["打断"])

# 全局打断标志
_interrupted = False


@router.post("/interrupt")
async def interrupt():
    """
    打断数字人当前播放
    停止 TTS 生成、停止 Avatar 推理、清空缓存队列，
    并通过 SSE 广播打断事件到全息仓。
    """
    global _interrupted
    _interrupted = True

    logger.info("收到打断信号，广播 SSE 打断事件")

    # 广播 SSE 打断事件到全息仓
    await broadcast_interrupt()

    return {
        "status": "ok",
        "message": "已打断数字人播放",
    }


@router.get("/interrupt/status")
async def interrupt_status() -> Dict:
    """获取打断状态"""
    global _interrupted
    return {"interrupted": _interrupted}