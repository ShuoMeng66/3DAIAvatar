"""
全息屏设备适配层
抽象不同品牌/型号全息屏的通信协议差异。
"""

from .generic_mp4 import GenericMP4Device
from .hologram_fan_app import HologramFanAppDevice
from .hdmi_rtsp import HDMIRTSPDevice

__all__ = ["GenericMP4Device", "HologramFanAppDevice", "HDMIRTSPDevice"]