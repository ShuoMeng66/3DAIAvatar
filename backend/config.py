"""
应用配置模块
从 .env 文件和环境变量中读取配置，提供默认值。
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# 加载项目根目录与 backend 目录的 .env
_root = Path(__file__).resolve().parent.parent
load_dotenv(_root / ".env")
load_dotenv(Path(__file__).resolve().parent / ".env")


class Settings:
    """应用全局配置"""

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "8010")))
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    LLM_API_KEY: str = os.getenv(
        "LLM_API_KEY",
        os.getenv("DASHSCOPE_API_KEY", "your-api-key-here"),
    )
    LLM_BASE_URL: str = os.getenv(
        "LLM_BASE_URL",
        "https://dashscope.aliyuncs.com/compatible-mode/v1",
    )
    LLM_MODEL: str = os.getenv("LLM_MODEL", "qwen-plus")

    TTS_ENGINE: str = os.getenv("TTS_ENGINE", "edge-tts")
    TTS_VOICE: str = os.getenv("TTS_VOICE", "zh-CN-XiaoxiaoNeural")
    TTS_RATE: float = float(os.getenv("TTS_RATE", "0.9"))

    ASR_ENGINE: str = os.getenv("ASR_ENGINE", "omnisensevoice")
    ASR_MODE: str = os.getenv("ASR_MODE", "whisper")
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")

    AVATAR_ENGINE: str = os.getenv("AVATAR_ENGINE", "musetalk")
    AVATAR_DEFAULT: str = os.getenv(
        "AVATAR_DEFAULT",
        os.getenv("AVATAR_IMAGE", "yiyu"),
    )
    AVATAR_LIST: str = os.getenv('AVATAR_LIST', '["yiyu"]')

    STREAM_BASE_URL: str = os.getenv("STREAM_BASE_URL", "http://localhost:8010")
    LINLY_STREAM_URL: str = os.getenv(
        "LINLY_STREAM_URL",
        "http://127.0.0.1:8000",
    )

    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    WEATHER_BASE_URL: str = os.getenv(
        "WEATHER_BASE_URL",
        "https://devapi.qweather.com/v7/weather/now",
    )
    REMINDER_CHECK_INTERVAL: int = int(os.getenv("REMINDER_CHECK_INTERVAL", "60"))

    # 项目根 assets 目录（backend 上一级）
    ASSETS_DIR: Path = _root / "assets"


settings = Settings()