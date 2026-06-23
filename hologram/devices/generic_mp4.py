"""
GenericMP4 设备适配器
导出全息 MP4 到 TF 卡 / U 盘 / 本地目录

适用场景：
- 所有支持 TF 卡播放的全息风扇屏
- 通过 USB 连接的全息投影设备
- 需要批量导出视频的场景
"""

import os
import shutil
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class GenericMP4Device:
    """
    TF 卡 / U 盘导出设备

    将转换好的全息视频文件复制到 TF 卡或本地目录，
    设备从 TF 卡读取并循环播放。

    常见设备：
    - 通用 3D LED 全息风扇屏（TF 卡版）
    - HY-3D 系列
    - 麦田科技 3D 全息广告机
    """

    def __init__(self, output_dir: str):
        """
        Args:
            output_dir: TF 卡/U 盘根目录或本地输出目录
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def export(self, video_path: str, *, filename: Optional[str] = None) -> bool:
        """
        导出视频文件到目标目录

        Args:
            video_path: 源视频文件路径
            filename: 目标文件名（不含特殊字符，建议英文）

        Returns:
            是否导出成功
        """
        src = Path(video_path)
        if not src.exists():
            logger.error(f"源文件不存在: {video_path}")
            return False

        if filename is None:
            filename = src.name

        # 确保文件名不含特殊字符
        safe_name = self._sanitize_filename(filename)
        dst = self.output_dir / safe_name

        try:
            shutil.copy2(src, dst)
            logger.info(f"导出成功: {dst}")
            return True
        except Exception as e:
            logger.error(f"导出失败: {e}")
            return False

    def export_batch(self, video_paths: list[str]) -> dict:
        """
        批量导出视频

        Returns:
            {"success": [...], "failed": [...]}
        """
        result = {"success": [], "failed": []}
        for path in video_paths:
            if self.export(path):
                result["success"].append(path)
            else:
                result["failed"].append(path)
        return result

    def list_files(self, pattern: str = "*.mp4") -> list[str]:
        """列出目标目录中的视频文件"""
        return [str(p) for p in self.output_dir.glob(pattern)]

    def clean(self):
        """清空目标目录"""
        for f in self.output_dir.glob("*.mp4"):
            f.unlink()
        logger.info(f"已清空: {self.output_dir}")

    @staticmethod
    def _sanitize_filename(name: str) -> str:
        """清理文件名：移除中文和特殊字符"""
        import re
        # 保留字母、数字、下划线、连字符、点
        safe = re.sub(r"[^\w\-.]", "_", name)
        return safe

    @staticmethod
    def get_setup_instructions() -> str:
        """获取 TF 卡使用说明"""
        return """
TF 卡全息屏播放步骤：
1. TF 卡格式化为 FAT32（≤32GB）或 exFAT（>32GB）
2. 将视频文件拷贝到 TF 卡根目录
3. 文件名建议使用英文 + 数字（如 hologram_001.mp4）
4. 插入全息屏 TF 卡槽
5. 设备开机自动播放，或通过遥控器选择文件
6. 部分设备按文件名排序循环播放
"""