"""
数字人形象管理路由模块
提供数字人形象列表和切换接口。
"""

from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/v1/avatar", tags=["数字人形象"])

# 默认数字人形象列表（占位）
DEFAULT_AVATARS = [
    {
        "id": "avatar_01",
        "name": "小暖（默认）",
        "description": "温暖亲切的女性护工形象",
        "preview_url": "/assets/avatars/default/avatar_01.jpg",
        "engine": "musetalk",
    },
    {
        "id": "avatar_02",
        "name": "小暖（备选）",
        "description": "温柔笑容的中年女性形象",
        "preview_url": "/assets/avatars/default/avatar_02.jpg",
        "engine": "musetalk",
    },
    {
        "id": "avatar_03",
        "name": "小暖（经典）",
        "description": "慈祥的老年女性形象",
        "preview_url": "/assets/avatars/default/avatar_03.jpg",
        "engine": "sadtalker",
    },
]


@router.get("/list")
async def avatar_list():
    """
    获取可选数字人形象列表
    
    响应:
    {
        "avatars": [...],
        "current": "avatar_01",
        "status": "ok"
    }
    """
    return {
        "avatars": DEFAULT_AVATARS,
        "current": "avatar_01",  # 占位：后续读取实际配置
        "status": "ok",
    }


@router.post("/select")
async def avatar_select(request: Request):
    """
    切换数字人形象
    
    请求体:
    {
        "avatar_id": "avatar_02"
    }
    
    响应:
    {
        "avatar_id": "avatar_02",
        "status": "ok",
        "message": "已切换为「小暖（备选）」"
    }
    """
    body = await request.json()
    avatar_id = body.get("avatar_id", "avatar_01")
    
    # 查找对应形象
    avatar = next((a for a in DEFAULT_AVATARS if a["id"] == avatar_id), None)
    if not avatar:
        return {
            "status": "error",
            "message": f"未找到形象: {avatar_id}",
        }
    
    # 占位实现：后续接入真实形象切换逻辑
    return {
        "avatar_id": avatar_id,
        "status": "ok",
        "message": f"已切换为「{avatar['name']}」",
    }