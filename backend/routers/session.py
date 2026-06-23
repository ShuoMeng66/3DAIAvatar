"""
会话管理路由模块
提供对话历史查询接口。
"""

from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/api/v1/session", tags=["会话管理"])

# 模拟对话历史存储（占位）
_MOCK_HISTORY = {
    "session_123": [
        {"role": "user", "content": "你好", "time": "2026-06-23T10:00:00"},
        {"role": "assistant", "content": "您好，我是小暖，今天过得怎么样？", "time": "2026-06-23T10:00:05"},
        {"role": "user", "content": "今天天气不错", "time": "2026-06-23T10:01:00"},
        {"role": "assistant", "content": "是啊，天气好心情也好。您有没有出去走走晒晒太阳？", "time": "2026-06-23T10:01:05"},
    ],
}


@router.get("/{session_id}/history")
async def session_history(
    session_id: str,
    limit: Optional[int] = 50,
    offset: Optional[int] = 0,
):
    """
    获取会话对话历史
    
    路径参数:
    - session_id: 会话 ID
    
    查询参数:
    - limit: 返回条数上限（默认 50）
    - offset: 偏移量（默认 0）
    
    响应:
    {
        "session_id": "session_123",
        "messages": [...],
        "total": 4,
        "status": "ok"
    }
    """
    history = _MOCK_HISTORY.get(session_id, [])
    
    # 分页
    paginated = history[offset:offset + limit]
    
    return {
        "session_id": session_id,
        "messages": paginated,
        "total": len(history),
        "status": "ok",
    }