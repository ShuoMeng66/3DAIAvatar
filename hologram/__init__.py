"""
全息屏适配模块
提供视频转换、实时推流、设备适配等功能，
用于将数字人视频输出到 3D LED 全息风扇屏。
"""

from .converter import HologramConverter
from .streamer import HologramStreamer

__all__ = ["HologramConverter", "HologramStreamer"]