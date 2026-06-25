"""
Linly-Talker-Stream HTTP 客户端
"""

import logging
from typing import Any, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)


async def _post(path: str, payload: dict) -> dict:
    url = f"{settings.LINLY_STREAM_URL.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=60.0, verify=False) as client:
        resp = await client.post(
            url,
            json=payload,
            headers={"Content-Type": "application/json"},
        )
        resp.raise_for_status()
        return resp.json()


async def linly_health() -> bool:
    try:
        url = f"{settings.LINLY_STREAM_URL.rstrip('/')}/health"
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            resp = await client.get(url)
            return resp.status_code == 200
    except Exception as e:
        logger.debug("Linly health check failed: %s", e)
        return False


async def send_human_chat(sessionid: int, text: str) -> str:
    """驱动 Linly 数字人说话，返回 LLM 回复文本"""
    data = await _post("/human", {"sessionid": sessionid, "type": "chat", "text": text})
    if data.get("code") != 0:
        raise RuntimeError(data.get("msg", "Linly /human failed"))
    return data.get("response") or ""


async def send_human_echo(sessionid: int, text: str) -> str:
    data = await _post("/human", {"sessionid": sessionid, "type": "echo", "text": text})
    if data.get("code") != 0:
        raise RuntimeError(data.get("msg", "Linly /human echo failed"))
    return data.get("response") or text


async def interrupt_talk(sessionid: int) -> None:
    data = await _post("/interrupt_talk", {"sessionid": sessionid})
    if data.get("code") != 0:
        raise RuntimeError(data.get("msg", "Linly interrupt failed"))
