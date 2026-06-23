"""
应用配置模块
从 .env 文件和环境变量中读取配置，提供默认值。
"""

import os
from dotenv import load_dotenv

# 加载 .env 文件中的环境变量
load_dotenv()


class Settings:
    """应用全局配置"""

    # --- 服务配置 ---
    # 服务主机地址
    HOST: str = os.getenv("HOST", "0.0.0.0")
    # 服务端口
    PORT: int = int(os.getenv("PORT", "8010"))
    # 前端开发服务器地址（用于 CORS 白名单）
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

    # --- LLM 配置 ---
    # LLM API 密钥
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "your-api-key-here")
    # LLM API 基础地址
    LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://api.deepseek.com")
    # LLM 模型名称
    LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek-chat")

    # --- TTS 配置 ---
    # 语音合成引擎：cosyvoice / edge-tts / openai-tts / volcengine-tts
    TTS_ENGINE: str = os.getenv("TTS_ENGINE", "cosyvoice")
    # TTS 语音角色
    TTS_VOICE: str = os.getenv("TTS_VOICE", "zh-CN-XiaoxiaoNeural")
    # TTS 语速（0.0 ~ 2.0）
    TTS_RATE: float = float(os.getenv("TTS_RATE", "0.9"))

    # --- ASR 配置 ---
    # 语音识别引擎：omnisensevoice / whisper / volcengine-asr
    ASR_ENGINE: str = os.getenv("ASR_ENGINE", "omnisensevoice")
    # 语音识别模式：whisper / volcengine-asr
    ASR_MODE: str = os.getenv("ASR_MODE", "whisper")
    # Whisper 模型大小
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")

    # --- 全息/数字人配置 ---
    # 数字人引擎：musetalk / placeholder / volcengine
    AVATAR_ENGINE: str = os.getenv("AVATAR_ENGINE", "musetalk")
    # 默认数字人角色
    AVATAR_DEFAULT: str = os.getenv("AVATAR_DEFAULT", "xiaonuan")
    # 可用数字人列表（JSON 数组字符串）
    AVATAR_LIST: str = os.getenv("AVATAR_LIST", '["xiaonuan"]')

    # --- Stream 配置 ---
    # Linly-Talker-Stream 后端地址
    STREAM_BASE_URL: str = os.getenv("STREAM_BASE_URL", "http://localhost:8010")

    # --- 日志配置 ---
    # 日志级别
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")

    # --- 天气配置 ---
    # 和风天气 API Key（免费申请：https://dev.qweather.com/）
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    # 和风天气实时天气 API 地址
    WEATHER_BASE_URL: str = os.getenv("WEATHER_BASE_URL", "https://devapi.qweather.com/v7/weather/now")

    # --- 吃药提醒配置 ---
    # 提醒检查间隔（秒）
    REMINDER_CHECK_INTERVAL: int = int(os.getenv("REMINDER_CHECK_INTERVAL", "60"))


# 全局配置单例
settings = Settings()