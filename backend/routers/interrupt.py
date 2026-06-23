"""
打断路由模块
提供数字人播放打断接口。
"""

from fastapi import APIRouter
from typing import Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["打断"])

# 全局打断标志（占位）
_interrupted = False


@router.post("/interrupt")
async def interrupt():
    """
    打断数字人当前播放
    停止 TTS 生成、停止 Avatar 推理、清空缓存队列
    
    响应:
    {
        "status": "ok",
        "message": "已打断数字人播放"
    }
    """
    global _interrupted
    _interrupted = True
    
    logger.info("收到打断信号，停止数字人播放")
    
    # 占位实现：
    # 1. 取消 LLM 流式生成
    # from services.llm_adapter import get_llm_adapter
    # llm = get_llm_adapter()
    # if llm:
    #     llm.cancel_stream()
    
    # 2. 停止 TTS 播放
    # 3. 停止 Avatar 推理
    # 4. 清空 WebSocket 缓存队列
    
    return {
        "status": "ok",
        "message": "已打断数字人播放",
    }


@router.get("/interrupt/status")
async def interrupt_status() -> Dict:
    """获取打断状态"""
    global _interrupted
    return {"interrupted": _interrupted}