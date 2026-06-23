"""
Linly-Talker-Stream Adapter 服务
封装对 Linly-Talker-Stream 后端 API 的代理调用。
不修改 Stream 核心逻辑，通过 HTTP 客户端代理请求。
"""

import os
import logging
from typing import Optional
import aiohttp

logger = logging.getLogger(__name__)


class StreamAdapter:
    """Linly-Talker-Stream 适配器，代理 HTTP 请求"""

    def __init__(self, config: dict):
        """
        初始化 Stream 适配器
        
        Args:
            config: 配置字典，包含 stream_base_url 等
        """
        self.base_url = config.get("stream_base_url", "http://localhost:8010")
        self.timeout = config.get("stream_timeout", 30)
        self._session: Optional[aiohttp.ClientSession] = None
        logger.info(f"Stream 适配器初始化: base_url={self.base_url}")

    async def _get_session(self) -> aiohttp.ClientSession:
        """获取或创建 HTTP 会话"""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            )
        return self._session

    async def health_check(self) -> dict:
        """
        健康检查 - 代理 GET /health
        """
        try:
            session = await self._get_session()
            async with session.get(f"{self.base_url}/health") as resp:
                return await resp.json()
        except Exception as e:
            logger.error(f"健康检查失败: {e}")
            return {"status": "error", "message": str(e)}

    async def webrtc_offer(self, sdp: str, offer_type: str = "offer") -> dict:
        """
        WebRTC 信令 - 代理 POST /offer
        
        Args:
            sdp: SDP 描述
            offer_type: offer 类型
        
        Returns:
            {"sdp": "...", "type": "answer"}
        """
        try:
            session = await self._get_session()
            payload = {"sdp": sdp, "type": offer_type}
            async with session.post(
                f"{self.base_url}/offer", json=payload
            ) as resp:
                return await resp.json()
        except Exception as e:
            logger.error(f"WebRTC 信令失败: {e}")
            return {"status": "error", "message": str(e)}

    async def human_chat(self, text: str) -> dict:
        """
        文字对话 - 代理 POST /human (type=chat)
        
        Args:
            text: 输入文本
        
        Returns:
            {"reply": "...", "status": "ok"}
        """
        try:
            session = await self._get_session()
            payload = {"text": text, "type": "chat"}
            async with session.post(
                f"{self.base_url}/human", json=payload
            ) as resp:
                return await resp.json()
        except Exception as e:
            logger.error(f"文字对话失败: {e}")
            return {"status": "error", "message": str(e)}

    async def asr(self, audio_bytes: bytes) -> dict:
        """
        语音识别 - 代理 POST /asr
        
        Args:
            audio_bytes: 音频字节数据
        
        Returns:
            {"text": "识别结果", "status": "ok"}
        """
        try:
            session = await self._get_session()
            form = aiohttp.FormData()
            form.add_field("audio", audio_bytes, filename="audio.wav")
            async with session.post(
                f"{self.base_url}/asr", data=form
            ) as resp:
                return await resp.json()
        except Exception as e:
            logger.error(f"语音识别失败: {e}")
            return {"status": "error", "message": str(e)}

    async def human_audio(self, audio_bytes: bytes, filename: str = "audio.wav") -> dict:
        """
        音频驱动数字人 - 代理 POST /humanaudio
        上传音频文件直接驱动数字人说话（跳过 ASR+LLM）。
        
        Args:
            audio_bytes: 音频字节数据
            filename: 文件名
        
        Returns:
            {"status": "ok", ...}
        """
        try:
            session = await self._get_session()
            form = aiohttp.FormData()
            form.add_field("audio", audio_bytes, filename=filename)
            async with session.post(
                f"{self.base_url}/humanaudio", data=form
            ) as resp:
                return await resp.json()
        except Exception as e:
            logger.error(f"音频驱动数字人失败: {e}")
            return {"status": "error", "message": str(e)}

    async def close(self):
        """关闭 HTTP 会话"""
        if self._session and not self._session.closed:
            await self._session.close()
            logger.info("Stream 适配器会话已关闭")


# 单例模式
_stream_adapter: Optional[StreamAdapter] = None


def get_stream_adapter(config: Optional[dict] = None) -> StreamAdapter:
    """获取 Stream 适配器单例"""
    global _stream_adapter
    if _stream_adapter is None and config is not None:
        _stream_adapter = StreamAdapter(config)
    return _stream_adapter