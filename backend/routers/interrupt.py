"""
打断路由模块
"""

from typing import Dict

from fastapi import APIRouter, Request
import logging

from routers.cabinet import broadcast_interrupt
from services import linly_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["打断"])

_interrupted = False


@router.post("/interrupt")
async def interrupt(request: Request):
    global _interrupted
    _interrupted = True

    linly_id = None
    try:
        body = await request.json()
        if isinstance(body, dict):
            linly_id = body.get("linly_session_id")
    except Exception:
        pass
    if linly_id is not None and linly_id > 0:
        try:
            await linly_client.interrupt_talk(linly_id)
        except Exception as e:
            logger.warning("Linly interrupt failed: %s", e)

    await broadcast_interrupt()

    return {
        "status": "ok",
        "message": "已打断数字人播放",
    }


@router.get("/interrupt/status")
async def interrupt_status() -> Dict:
    global _interrupted
    return {"interrupted": _interrupted}
