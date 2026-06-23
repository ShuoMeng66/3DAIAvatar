"""
全息视频实时推流
支持三种推流方式：
- 方案 A：RTSP 服务器（mediamtx / ffmpeg）
- 方案 B：WebSocket 推送 JPEG 帧序列
- 方案 C：Watch Folder（写入本地目录，由全息 APP 同步）
"""

import subprocess
import asyncio
import logging
import os
import shutil
from pathlib import Path
from threading import Thread
from typing import Optional, Callable
from datetime import datetime

logger = logging.getLogger(__name__)


class HologramStreamer:
    """
    全息推流器

    支持协议：
    - RTSP: 实时流媒体协议（兼容大部分 IP 摄像头/NVR 软件）
    - WebSocket: 帧序列推送（低延迟，需自定义接收端）
    - Watch Folder: 本地目录监控（全息 APP 自动同步）
    """

    def __init__(
        self,
        resolution: int = 512,
        fps: int = 25,
        bitrate: str = "2M",
    ):
        self.resolution = resolution
        self.fps = fps
        self.bitrate = bitrate
        self._ffmpeg_process: Optional[subprocess.Popen] = None
        self._running = False

    # ============================================================
    # 方案 A：RTSP 推流
    # ============================================================

    def start_rtsp(
        self,
        input_source: str,
        rtsp_url: str = "rtsp://localhost:8554/hologram",
        *,
        use_gpu: bool = False,
    ) -> bool:
        """
        启动 RTSP 推流

        Args:
            input_source: 输入源（视频文件路径、摄像头设备 /dev/video0、或 pipe:0）
            rtsp_url: RTSP 推流地址
            use_gpu: 是否使用 NVENC 硬件编码

        Returns:
            是否启动成功

        依赖：
        - mediamtx (RTSP 服务器): docker run -d --network=host bluenviron/mediamtx
        - 或直接使用 ffmpeg 推流到支持 RTSP 的设备
        """
        # 确保 mediamtx 在运行
        if not self._check_rtsp_server():
            logger.warning("RTSP 服务器未运行，请先启动: docker run -d --network=host bluenviron/mediamtx")

        # 构建 ffmpeg 推流命令
        cmd = [
            "ffmpeg",
            "-re",  # 实时读取
            "-i", str(input_source),
            "-vf", (
                f"crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2,"
                f"scale={self.resolution}:{self.resolution},"
                f"format=yuv420p"
            ),
        ]

        # 编码器选择
        if use_gpu:
            cmd.extend([
                "-c:v", "h264_nvenc",
                "-preset", "p1",  # 最低延迟
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
            "-an",  # 无音频
            "-f", "rtsp",
            rtsp_url,
        ])

        logger.info(f"启动 RTSP 推流: {rtsp_url}")
        logger.debug(f"ffmpeg: {' '.join(cmd)}")

        try:
            self._ffmpeg_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            self._running = True
            return True
        except Exception as e:
            logger.error(f"RTSP 推流启动失败: {e}")
            return False

    def stop_rtsp(self):
        """停止 RTSP 推流"""
        if self._ffmpeg_process:
            self._ffmpeg_process.terminate()
            try:
                self._ffmpeg_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._ffmpeg_process.kill()
            self._ffmpeg_process = None
        self._running = False
        logger.info("RTSP 推流已停止")

    def _check_rtsp_server(self) -> bool:
        """检查 RTSP 服务器是否运行"""
        try:
            import socket
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1)
            result = s.connect_ex(("localhost", 8554))
            s.close()
            return result == 0
        except Exception:
            return False

    # ============================================================
    # 方案 B：WebSocket 帧序列推送
    # ============================================================

    async def start_websocket(
        self,
        input_source: str,
        ws_url: str = "ws://localhost:8080/hologram",
        *,
        jpeg_quality: int = 85,
    ):
        """
        启动 WebSocket 帧序列推送

        Args:
            input_source: 输入源（视频文件路径或摄像头设备）
            ws_url: WebSocket 服务地址
            jpeg_quality: JPEG 压缩质量 (1-100)

        注意：需要安装 websockets 库
              pip install websockets opencv-python
        """
        try:
            import websockets
            import cv2
            import numpy as np
        except ImportError:
            logger.error("需要安装: pip install websockets opencv-python")
            return

        cap = cv2.VideoCapture(input_source)
        if not cap.isOpened():
            logger.error(f"无法打开输入源: {input_source}")
            return

        self._running = True
        logger.info(f"启动 WebSocket 推流: {ws_url}")

        try:
            async with websockets.connect(ws_url) as ws:
                while self._running:
                    ret, frame = cap.read()
                    if not ret:
                        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # 循环播放
                        continue

                    # 正方形裁剪 + 缩放
                    h, w = frame.shape[:2]
                    crop_size = min(w, h)
                    x_off = (w - crop_size) // 2
                    y_off = (h - crop_size) // 2
                    cropped = frame[y_off:y_off+crop_size, x_off:x_off+crop_size]
                    resized = cv2.resize(cropped, (self.resolution, self.resolution))

                    # JPEG 编码
                    _, jpeg = cv2.imencode(".jpg", resized, [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality])

                    await ws.send(jpeg.tobytes())
                    await asyncio.sleep(1.0 / self.fps)

        except Exception as e:
            logger.error(f"WebSocket 推流异常: {e}")
        finally:
            cap.release()
            self._running = False

    # ============================================================
    # 方案 C：Watch Folder（写入本地目录）
    # ============================================================

    def start_watch_folder(
        self,
        input_source: str,
        watch_dir: str,
        *,
        chunk_duration: int = 30,
    ):
        """
        启动 Watch Folder 模式

        将视频切分为分段 MP4，写入监控目录，
        全息 APP 自动检测新文件并同步播放。

        Args:
            input_source: 输入源（视频文件路径）
            watch_dir: 监控目录路径
            chunk_duration: 每段视频时长（秒）
        """
        watch_path = Path(watch_dir)
        watch_path.mkdir(parents=True, exist_ok=True)

        self._running = True
        logger.info(f"启动 Watch Folder: {watch_dir}")

        def _run():
            chunk_index = 0
            while self._running:
                chunk_file = watch_path / f"hologram_chunk_{chunk_index:04d}.mp4"

                cmd = [
                    "ffmpeg",
                    "-y",
                    "-ss", str(chunk_index * chunk_duration),
                    "-i", str(input_source),
                    "-t", str(chunk_duration),
                    "-vf", (
                        f"crop=min(iw\\,ih):min(iw\\,ih):(iw-min(iw\\,ih))/2:(ih-min(iw\\,ih))/2,"
                        f"scale={self.resolution}:{self.resolution},"
                        f"format=yuv420p"
                    ),
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-crf", "18",
                    "-pix_fmt", "yuv420p",
                    "-r", str(self.fps),
                    "-an",
                    str(chunk_file),
                ]

                try:
                    subprocess.run(cmd, check=True, timeout=chunk_duration * 2)
                    logger.info(f"写入: {chunk_file.name}")
                except subprocess.TimeoutExpired:
                    logger.error(f"分段 {chunk_index} 超时")
                    break
                except Exception as e:
                    logger.error(f"分段 {chunk_index} 失败: {e}")
                    break

                chunk_index += 1

        thread = Thread(target=_run, daemon=True)
        thread.start()

    def stop_watch_folder(self):
        """停止 Watch Folder"""
        self._running = False
        logger.info("Watch Folder 已停止")

    # ============================================================
    # 工具方法
    # ============================================================

    def is_running(self) -> bool:
        """检查是否正在推流"""
        return self._running

    def get_ffplay_command(self, rtsp_url: str) -> str:
        """获取 ffplay 播放命令（用于测试 RTSP 流）"""
        return f"ffplay -rtsp_transport tcp {rtsp_url}"


# ============================================================
# 命令行入口
# ============================================================
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="全息视频推流工具")
    subparsers = parser.add_subparsers(dest="mode", help="推流模式")

    # RTSP 模式
    rtsp_parser = subparsers.add_parser("rtsp", help="RTSP 推流")
    rtsp_parser.add_argument("input", help="输入视频文件")
    rtsp_parser.add_argument("--url", default="rtsp://localhost:8554/hologram", help="RTSP URL")
    rtsp_parser.add_argument("-r", "--resolution", type=int, default=512, help="分辨率")
    rtsp_parser.add_argument("--gpu", action="store_true", help="使用 GPU 编码")

    # Watch Folder 模式
    watch_parser = subparsers.add_parser("watch", help="Watch Folder 模式")
    watch_parser.add_argument("input", help="输入视频文件")
    watch_parser.add_argument("--dir", default="./hologram_output", help="输出目录")
    watch_parser.add_argument("-r", "--resolution", type=int, default=512, help="分辨率")
    watch_parser.add_argument("--chunk", type=int, default=30, help="分段时长（秒）")

    args = parser.parse_args()

    streamer = HologramStreamer(resolution=args.resolution)

    if args.mode == "rtsp":
        streamer.start_rtsp(args.input, args.url, use_gpu=args.gpu)
        print(f"RTSP 推流已启动: {args.url}")
        print("ffplay 测试: ffplay -rtsp_transport tcp rtsp://localhost:8554/hologram")
        try:
            while True:
                pass
        except KeyboardInterrupt:
            streamer.stop_rtsp()

    elif args.mode == "watch":
        streamer.start_watch_folder(args.input, args.dir, chunk_duration=args.chunk)
        print(f"Watch Folder: {args.dir}")
        try:
            while True:
                pass
        except KeyboardInterrupt:
            streamer.stop_watch_folder()

    else:
        parser.print_help()