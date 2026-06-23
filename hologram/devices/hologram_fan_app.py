"""
全息风扇屏 APP 适配器
通过 WiFi 局域网 HTTP API 上传视频

适用设备：
- 3D LED Fan（可连接 WiFi + 配套 APP 型号）
- 部分品牌支持 HTTP API 上传
- 局域网 CMS 管理系统

注意：各品牌 APP 协议不同，本章提供通用抽象 + 常见品牌实现
"""

import logging
import json
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin

logger = logging.getLogger(__name__)


class HologramFanAppDevice:
    """
    全息风扇屏 WiFi APP 设备

    通过 HTTP API 上传视频到设备
    """

    def __init__(self, device_ip: str, port: int = 80):
        """
        Args:
            device_ip: 设备 IP 地址（在 APP 中查看或路由器后台查看）
            port: HTTP 端口（默认 80）
        """
        self.device_ip = device_ip
        self.port = port
        self.base_url = f"http://{device_ip}:{port}"

    async def upload(self, video_path: str) -> bool:
        """
        上传视频到设备（通用 HTTP 上传）

        尝试多种常见 API 路径：
        1. POST /upload
        2. POST /api/upload
        3. POST /action/upload

        Args:
            video_path: 视频文件路径

        Returns:
            是否上传成功
        """
        try:
            import aiohttp
        except ImportError:
            logger.error("需要安装 aiohttp: pip install aiohttp")
            return False

        src = Path(video_path)
        if not src.exists():
            logger.error(f"视频文件不存在: {video_path}")
            return False

        # 尝试多种上传路径
        upload_paths = [
            "/upload",
            "/api/upload",
            "/api/v1/upload",
            "/action/upload",
            "/file/upload",
        ]

        async with aiohttp.ClientSession() as session:
            for path in upload_paths:
                url = urljoin(self.base_url, path)
                try:
                    with open(video_path, "rb") as f:
                        form = aiohttp.FormData()
                        form.add_field("file", f, filename=src.name)

                        async with session.post(url, data=form, timeout=30) as resp:
                            if resp.status == 200:
                                logger.info(f"上传成功: {url}")
                                return True
                            else:
                                logger.debug(f"路径 {path} 返回 {resp.status}")
                except Exception as e:
                    logger.debug(f"路径 {path} 失败: {e}")

        logger.error(f"所有上传路径均失败，设备 {self.device_ip} 可能不支持标准 HTTP API")
        return False

    async def get_status(self) -> dict:
        """获取设备状态"""
        try:
            import aiohttp
        except ImportError:
            return {"error": "aiohttp 未安装"}

        status_paths = ["/status", "/api/status", "/info"]

        async with aiohttp.ClientSession() as session:
            for path in status_paths:
                url = urljoin(self.base_url, path)
                try:
                    async with session.get(url, timeout=5) as resp:
                        if resp.status == 200:
                            return await resp.json()
                except Exception:
                    continue

        return {"error": "无法获取设备状态", "ip": self.device_ip}

    async def get_file_list(self) -> list:
        """获取设备上的文件列表"""
        try:
            import aiohttp
        except ImportError:
            return []

        list_paths = ["/files", "/api/files", "/list"]

        async with aiohttp.ClientSession() as session:
            for path in list_paths:
                url = urljoin(self.base_url, path)
                try:
                    async with session.get(url, timeout=5) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            return data if isinstance(data, list) else data.get("files", [])
                except Exception:
                    continue

        return []

    async def delete_file(self, filename: str) -> bool:
        """删除设备上的文件"""
        try:
            import aiohttp
        except ImportError:
            return False

        delete_paths = [
            f"/delete?file={filename}",
            f"/api/delete?file={filename}",
            f"/file/delete?name={filename}",
        ]

        async with aiohttp.ClientSession() as session:
            for path in delete_paths:
                url = urljoin(self.base_url, path)
                try:
                    async with session.post(url, timeout=5) as resp:
                        if resp.status == 200:
                            return True
                except Exception:
                    continue

        return False

    @staticmethod
    def get_setup_instructions() -> str:
        """获取 WiFi APP 使用说明"""
        return """
WiFi APP 全息屏使用步骤：
1. 全息屏连接电源，等待启动
2. 下载厂商配套 APP：
   - 3D LED FAN（Google Play / App Store 搜索）
   - 扫描设备屏幕显示的二维码
3. 将手机连接到全息屏的 WiFi 热点（通常名为 "FAN_XXXX"）
4. 在 APP 中上传视频或管理播放列表
5. 如需通过 HTTP API 上传，查看路由器后台获取设备 IP

常见品牌 APP 名称：
- 3D LED FAN
- Wow Hologram
- HoloPlay
- HY-3D 全息屏
"""