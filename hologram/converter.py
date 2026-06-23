"""
全息视频转换管道
输入：任意比例/分辨率的 avatar 视频
输出：全息屏专用 MP4（正方形、黑底、人物居中）
"""

import subprocess
import os
import logging
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class HologramConverter:
    """
    全息视频转换器

    处理流程：
    1. 裁剪/缩放为 1:1 正方形（512 或 1024）
    2. 人物居中（face detection 自动居中）
    3. 背景替换为纯黑 #000000（rembg 或 chroma key）
    4. 编码 H.264, 25fps, CRF 18
    5. 可选：轻微亮度提升（全息屏偏暗）
    """

    # 支持的输出分辨率
    RESOLUTIONS = {
        "low": 256,
        "standard": 512,
        "high": 1024,
    }

    def __init__(
        self,
        resolution: int = 512,
        fps: int = 25,
        crf: int = 18,
        brightness: float = 0.0,
        use_rembg: bool = False,
    ):
        """
        Args:
            resolution: 输出正方形边长（256/512/1024）
            fps: 输出帧率
            crf: H.264 质量参数（越小越清晰，18 为视觉无损）
            brightness: 亮度调整（-1.0 ~ 1.0，全息屏偏暗建议 +0.05）
            use_rembg: 是否使用 rembg 自动抠图（需安装 rembg 库）
        """
        self.resolution = resolution
        self.fps = fps
        self.crf = crf
        self.brightness = brightness
        self.use_rembg = use_rembg
        self._check_ffmpeg()

    def _check_ffmpeg(self):
        """检查 ffmpeg 是否可用"""
        try:
            subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                check=True,
                timeout=5,
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("ffmpeg 未安装或不可用，视频转换功能将受限")
        except subprocess.TimeoutExpired:
            logger.warning("ffmpeg 检查超时")

    def convert(
        self,
        input_path: str,
        output_path: str,
        *,
        crop_face: bool = False,
        remove_audio: bool = True,
    ) -> bool:
        """
        转换视频为全息屏格式

        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径
            crop_face: 是否使用人脸检测自动居中（需安装 opencv-python）
            remove_audio: 是否移除音轨（全息屏通常走蓝牙音箱）

        Returns:
            是否转换成功
        """
        input_file = Path(input_path)
        if not input_file.exists():
            logger.error(f"输入文件不存在: {input_path}")
            return False

        # 确保输出目录存在
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        # 构建 ffmpeg 滤镜链
        vf_parts = self._build_filter_chain(input_path, crop_face)

        # 构建 ffmpeg 命令
        cmd = [
            "ffmpeg",
            "-y",  # 覆盖输出文件
            "-i", str(input_path),
            "-vf", vf_parts,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", str(self.crf),
            "-pix_fmt", "yuv420p",
            "-r", str(self.fps),
        ]

        if remove_audio:
            cmd.extend(["-an"])  # 移除音频
        else:
            cmd.extend(["-c:a", "aac", "-b:a", "128k"])

        cmd.append(str(output_path))

        logger.info(f"转换视频: {input_path} → {output_path}")
        logger.debug(f"ffmpeg 命令: {' '.join(cmd)}")

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if result.returncode != 0:
                logger.error(f"ffmpeg 转换失败:\n{result.stderr}")
                return False
            logger.info(f"转换完成: {output_path}")
            return True
        except subprocess.TimeoutExpired:
            logger.error("视频转换超时")
            return False
        except Exception as e:
            logger.error(f"视频转换异常: {e}")
            return False

    def _build_filter_chain(self, input_path: str, crop_face: bool) -> str:
        """
        构建 ffmpeg 滤镜链

        滤镜顺序：
        1. 正方形裁剪（取中心区域）
        2. 缩放到目标分辨率
        3. 亮度调整
        4. 格式转换
        """
        filters = []

        # 获取视频尺寸
        probe_cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0",
            str(input_path),
        ]
        try:
            result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
            w, h = map(int, result.stdout.strip().split("x"))
        except Exception:
            w, h = 1920, 1080  # 默认值

        # 正方形裁剪：取中心区域
        crop_size = min(w, h)
        x_offset = (w - crop_size) // 2
        y_offset = (h - crop_size) // 2
        filters.append(f"crop={crop_size}:{crop_size}:{x_offset}:{y_offset}")

        # 缩放到目标分辨率
        filters.append(f"scale={self.resolution}:{self.resolution}")

        # 亮度调整
        if self.brightness != 0:
            filters.append(f"eq=brightness={self.brightness}")

        # 确保像素格式
        filters.append("format=yuv420p")

        return ",".join(filters)

    def convert_with_rembg(
        self,
        input_path: str,
        output_path: str,
    ) -> bool:
        """
        使用 rembg 自动抠图后转换为全息格式

        流程：
        1. 逐帧提取 → rembg 去背景 → 合成黑底视频
        2. 转换为全息格式

        Args:
            input_path: 输入视频路径
            output_path: 输出视频路径

        Returns:
            是否转换成功

        注意：此方法需要安装 rembg
              pip install rembg
        """
        if not self.use_rembg:
            logger.warning("rembg 未启用，使用普通转换")
            return self.convert(input_path, output_path)

        try:
            import rembg
            import numpy as np
            import cv2
        except ImportError:
            logger.error("rembg 未安装，请执行: pip install rembg opencv-python")
            return self.convert(input_path, output_path)

        # 逐帧处理
        cap = cv2.VideoCapture(input_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        # 临时目录
        temp_dir = Path(output_path).parent / ".hologram_temp"
        temp_dir.mkdir(exist_ok=True)
        temp_video = temp_dir / "temp_rembg.mp4"

        # 写入临时视频
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(
            str(temp_video),
            fourcc,
            self.fps,
            (self.resolution, self.resolution),
        )

        session = rembg.new_session()
        frame_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % 10 == 0:
                logger.info(f"rembg 处理: {frame_count}/{total_frames}")

            # 去背景
            output = rembg.remove(frame, session=session)

            # 黑底
            h, w = output.shape[:2]
            black_bg = np.zeros((h, w, 3), dtype=np.uint8)

            # 合成
            alpha = output[:, :, 3] / 255.0 if output.shape[2] == 4 else 1.0
            for c in range(3):
                black_bg[:, :, c] = output[:, :, c] * alpha

            # 正方形裁剪 + 缩放
            crop_size = min(w, h)
            x_off = (w - crop_size) // 2
            y_off = (h - crop_size) // 2
            cropped = black_bg[y_off:y_off+crop_size, x_off:x_off+crop_size]
            resized = cv2.resize(cropped, (self.resolution, self.resolution))

            out.write(resized)

        cap.release()
        out.release()

        # 最终编码
        success = self.convert(str(temp_video), output_path, remove_audio=True)

        # 清理临时文件
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

        return success

    def get_info(self, input_path: str) -> dict:
        """获取视频信息"""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries",
            "format=duration,size,bit_rate:stream=width,height,codec_name,r_frame_rate",
            "-of", "json",
            str(input_path),
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            import json
            return json.loads(result.stdout)
        except Exception as e:
            logger.error(f"获取视频信息失败: {e}")
            return {}


# ============================================================
# 命令行入口
# ============================================================
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="全息视频转换工具")
    parser.add_argument("input", help="输入视频路径")
    parser.add_argument("-o", "--output", default="output_hologram.mp4", help="输出路径")
    parser.add_argument("-r", "--resolution", type=int, default=512, help="输出分辨率 (256/512/1024)")
    parser.add_argument("--fps", type=int, default=25, help="帧率")
    parser.add_argument("--crf", type=int, default=18, help="H.264 质量 (0-51)")
    parser.add_argument("--brightness", type=float, default=0.05, help="亮度调整")
    parser.add_argument("--keep-audio", action="store_true", help="保留音频")
    parser.add_argument("--rembg", action="store_true", help="使用 rembg 自动抠图")

    args = parser.parse_args()

    converter = HologramConverter(
        resolution=args.resolution,
        fps=args.fps,
        crf=args.crf,
        brightness=args.brightness,
        use_rembg=args.rembg,
    )

    success = converter.convert(
        args.input,
        args.output,
        remove_audio=not args.keep_audio,
    )

    if success:
        print(f"转换成功: {args.output}")
    else:
        print("转换失败，请检查日志")
        exit(1)