"""
HDMI / RTSP 设备适配器
通过 RTSP 实时推流到支持 HDMI IN 或 RTSP 拉流的全息屏

适用设备：
- 支持 HDMI IN 的高端全息风扇屏
- 通过 RTSP 中转盒转 HDMI 的设备
- 支持 RTSP 拉流的 CMS 系统
- 通用 RTSP 播放器（VLC / ffplay）

架构：
  数字人视频 → FFmpeg → RTSP (mediamtx) → 全息屏 / VLC 播放
"""

import logging
import subprocess
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class HDMIRTSPDevice:
    """
    HDMI / RTSP 推流设备

    通过 RTSP 协议实时推流视频到全息屏设备。
    需要 mediamtx 作为 RTSP 服务器中转。
    """

    def __init__(
        self,
        rtsp_url: str = "rtsp://localhost:8554/hologram",
        resolution: int = 512,
        fps: int = 25,
        bitrate: str = "2M",
    ):
        """
        Args:
            rtsp_url: RTSP 推流地址
            resolution: 输出分辨率（正方形）
            fps: 帧率
            bitrate: 比特率
        """
        self.rtsp_url = rtsp_url
        self.resolution = resolution
        self.fps = fps
        self.bitrate = bitrate
        self._process: Optional[subprocess.Popen] = None

    def start_stream(self, input_source: str, *, use_gpu: bool = False) -> bool:
        """
        启动 RTSP 推流

        Args:
            input_source: 输入源（视频文件、摄像头设备、或 pipe:0）
            use_gpu: 是否使用 NVENC 硬件编码

        Returns:
            是否启动成功
        """
        # 确保 mediamtx 服务器运行
        self._ensure_mediamtx()

        cmd = [
            "ffmpeg",
            "-re",
            "-i", str(input_source),
            "-vf", (
                f"crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2,"
                f"scale={self.resolution}:{self.resolution},"
                f"format=yuv420p"
            ),
        ]

        if use_gpu:
            cmd.extend([
                "-c:v", "h264_nvenc",
                "-preset", "p1",
                "-tune", "ll",
                "-b:v", self.bitrate,
            ])
        else:
            cmd.extend([
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-tune", "zerolatency",
                "-b:v", self.bitrate,
            ])

        cmd.extend([
            "-pix_fmt", "yuv420p",
            "-r", str(self.fps),
            "-an",
            "-f", "rtsp",
            self.rtsp_url,
        ])

        logger.info(f"启动 RTSP 推流: {self.rtsp_url}")

        try:
            self._process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            return True
        except Exception as e:
            logger.error(f"RTSP 推流失败: {e}")
            return False

    def stop_stream(self):
        """停止推流"""
        if self._process:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._process.kill()
            self._process = None
        logger.info("RTSP 推流已停止")

    def is_streaming(self) -> bool:
        """检查是否正在推流"""
        return self._process is not None and self._process.poll() is None

    @staticmethod
    def _ensure_mediamtx():
        """确保 mediamtx RTSP 服务器在运行"""
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1)
        try:
            s.connect(("localhost", 8554))
            s.close()
            return
        except Exception:
            pass

        logger.warning("mediamtx 未运行，请执行:")
        logger.warning("  docker run -d --network=host bluenviron/mediamtx")

    @staticmethod
    def get_ffplay_command(rtsp_url: str) -> str:
        """获取 ffplay 测试命令"""
        return f"ffplay -rtsp_transport tcp {rtsp_url}"

    @staticmethod
    def get_vlc_command(rtsp_url: str) -> str:
        """获取 VLC 播放命令"""
        return f"vlc {rtsp_url}"

    @staticmethod
    def get_setup_instructions() -> str:
        """获取 RTSP/HDMI 部署说明"""
        return """
RTSP 全息推流部署步骤：

1. 启动 mediamtx RTSP 服务器：
   docker run -d --network=host bluenviron/mediamtx
   
2. 启动推流：
   python -m hologram.streamer rtsp input_video.mp4

3. 播放测试：
   ffplay -rtsp_transport tcp rtsp://localhost:8554/hologram

4. 全息屏接收：
   - HDMI IN 型号：使用 RTSP→HDMI 转码盒（如 VLC 全屏输出到 HDMI 显卡）
   - RTSP 直连型号：在设备管理后台设置拉流地址
   - 局域网 CMS：添加 RTSP 源地址

延迟参考：
- 局域网 RTSP: 1-3 秒
- 本地 ffplay: < 500ms
- 远程 RTSP: 取决于网络
"""