"""
Linly-Talker-Stream 代理路由
"""

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from services import linly_client

router = APIRouter(prefix="/api/v1/linly", tags=["Linly"])


class LinlyHumanRequest(BaseModel):
    sessionid: int
    text: str
    type: str = "chat"


class LinlyInterruptRequest(BaseModel):
    sessionid: int


@router.post("/human")
async def proxy_human(body: LinlyHumanRequest):
    if body.type == "echo":
        reply = await linly_client.send_human_echo(body.sessionid, body.text)
    else:
        reply = await linly_client.send_human_chat(body.sessionid, body.text)
    return {"code": 0, "response": reply, "status": "ok"}


@router.post("/interrupt")
async def proxy_interrupt(body: LinlyInterruptRequest):
    await linly_client.interrupt_talk(body.sessionid)
    return {"code": 0, "status": "ok"}


@router.get("/health")
async def proxy_health():
    ok = await linly_client.linly_health()
    return {"status": "ok" if ok else "unavailable", "linly": ok}
