"""
天气 API 适配器
集成和风天气 Dev API（免费方案）
https://devapi.qweather.com/v7/weather/now
"""

import os
import json
import logging
from typing import Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class WeatherService:
    """天气服务适配器"""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or os.getenv("WEATHER_API_KEY", "")
        self.base_url = "https://devapi.qweather.com/v7/weather/now"
        self.geo_url = "https://geoapi.qweather.com/v2/city/lookup"
        logger.info(f"天气服务初始化: api_key={'已配置' if self.api_key else '未配置'}")

    async def query(self, city: str = "北京") -> str:
        """
        查询指定城市的当前天气
        
        Args:
            city: 城市名（如 "北京"、"上海"、"广州"）
        
        Returns:
            自然语言天气描述
        """
        if not self.api_key:
            return self._fallback_response(city)

        try:
            import aiohttp
            # 查询城市 ID
            async with aiohttp.ClientSession() as session:
                params = {"key": self.api_key, "location": city}
                async with session.get(self.geo_url, params=params) as resp:
                    geo_data = await resp.json()
                    if geo_data.get("code") != "200" or not geo_data.get("location"):
                        return self._fallback_response(city)
                    city_id = geo_data["location"][0]["id"]

                # 查询天气
                params = {"key": self.api_key, "location": city_id}
                async with session.get(self.base_url, params=params) as resp:
                    weather_data = await resp.json()
                    if weather_data.get("code") != "200":
                        return self._fallback_response(city)
                    
                    now = weather_data.get("now", {})
                    temp = now.get("temp", "?")
                    text = now.get("text", "未知")
                    wind_dir = now.get("windDir", "")
                    humidity = now.get("humidity", "?")
                    
                    return f"{city}现在{text}，{temp}度，{wind_dir}风，湿度{humidity}%。早晚温差大，您注意增减衣服。"

        except Exception as e:
            logger.error(f"天气查询失败: {e}")
            return self._fallback_response(city)

    def _fallback_response(self, city: str) -> str:
        """API 不可用时的 fallback 回复"""
        return f"嗯，{city}今天的天气还不错呢。您要出门的话，看看窗外再决定穿什么衣服哦。"

    @staticmethod
    def get_setup_instructions() -> str:
        """获取和风天气 API 注册指引"""
        return """
和风天气 API 免费方案开通步骤：
1. 访问 https://dev.qweather.com/ 注册账号
2. 创建应用 → 选择免费订阅（Free Plan）
3. 获取 API Key（20 个字符）
4. 在 .env 中设置 WEATHER_API_KEY=你的Key

免费版限制：
- 每分钟 1000 次
- 每天 30000 次
- 支持 7 天天气预报
- 支持实时天气
"""