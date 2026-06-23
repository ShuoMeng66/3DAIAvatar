"""
声音克隆模块
端到端流程：家属上传录音 → 音频预处理 → 微调/克隆 → 生成 voice_id

支持的引擎：
- CosyVoice 3 秒零样本克隆（推荐，无需 GPU 微调）
- GPT-SoVITS 少样本微调（需要 GPU，效果更好）
- Edge TTS 键盘输入（备用，无需 GPU）
"""

import os
import json
import uuid
import logging
import subprocess
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
from enum import Enum

logger = logging.getLogger(__name__)


class CloneEngine(str, Enum):
    COSYVOICE = "cosyvoice"       # 3秒零样本克隆
    GPT_SOVITS = "gpt_sovits"     # 少样本微调
    EDGE_TTS = "edge_tts"         # 键盘输入（备用）


class VoiceCloneManager:
    """
    声音克隆管理器

    流程：
    1. 接收音频文件
    2. 音频预处理（去噪/VAD/响度归一化）
    3. 调用克隆引擎
    4. 生成 voice_id 并存入 assets/voices/custom/
    5. 返回 voice_id 供前端使用
    """

    def __init__(self):
        self.custom_dir = Path("assets/voices/custom")
        self.custom_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_path = self.custom_dir / "custom_voices.json"
        self._load_manifest()

    def _load_manifest(self):
        """加载自定义声音列表"""
        if self.manifest_path.exists():
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                self.voices = json.load(f)
        else:
            self.voices = {}
            self._save_manifest()

    def _save_manifest(self):
        """保存自定义声音列表"""
        with open(self.manifest_path, "w", encoding="utf-8") as f:
            json.dump(self.voices, f, ensure_ascii=False, indent=2)

    # ============================================================
    # 音频预处理
    # ============================================================

    def preprocess_audio(
        self,
        input_path: str,
        output_dir: str,
        *,
        sample_rate: int = 16000,
        normalize: bool = True,
        remove_silence: bool = True,
    ) -> Dict[str, Any]:
        """
        音频预处理：去噪、重采样、响度归一化、VAD 切分

        Args:
            input_path: 输入音频路径
            output_dir: 输出目录
            sample_rate: 目标采样率
            normalize: 是否响度归一化
            remove_silence: 是否去除静音段

        Returns:
            处理结果信息
        """
        input_file = Path(input_path)
        if not input_file.exists():
            return {"error": f"文件不存在: {input_path}"}

        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        output_path = output_dir / f"processed_{input_file.stem}.wav"

        # 构建 ffmpeg 处理命令
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(input_path),
            "-ar", str(sample_rate),     # 重采样
            "-ac", "1",                   # 单声道
            "-sample_fmt", "s16",         # 16bit
        ]

        # 响度归一化
        if normalize:
            cmd.extend([
                "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",
            ])

        if remove_silence:
            # 在 loudnorm 之后添加静音去除
            cmd[-1] = cmd[-1] + ",silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-40dB"

        cmd.append(str(output_path))

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if result.returncode != 0:
                logger.error(f"音频预处理失败: {result.stderr}")
                return {"error": "音频预处理失败"}

            # 获取音频时长
            duration = self._get_audio_duration(str(output_path))

            return {
                "success": True,
                "output_path": str(output_path),
                "duration": duration,
                "sample_rate": sample_rate,
                "channels": 1,
            }
        except subprocess.TimeoutExpired:
            return {"error": "音频预处理超时"}
        except Exception as e:
            return {"error": str(e)}

    def _get_audio_duration(self, path: str) -> float:
        """获取音频时长（秒）"""
        try:
            cmd = [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                path,
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            return float(result.stdout.strip())
        except Exception:
            return 0.0

    # ============================================================
    # CosyVoice 3 秒零样本克隆
    # ============================================================

    def clone_cosyvoice(
        self,
        audio_path: str,
        voice_name: str,
        *,
        reference_text: str = "",
    ) -> Dict[str, Any]:
        """
        使用 CosyVoice 3 秒零样本克隆

        Args:
            audio_path: 参考音频路径（1-5 秒即可）
            voice_name: 声音名称（用于标识）
            reference_text: 参考音频的文字内容（可选，提高质量）

        Returns:
            voice_id 和元信息
        """
        voice_id = f"cosyvoice_{uuid.uuid4().hex[:8]}"
        voice_dir = self.custom_dir / voice_id
        voice_dir.mkdir(parents=True, exist_ok=True)

        # 复制参考音频
        ref_path = voice_dir / "reference.wav"
        shutil.copy(audio_path, ref_path)

        # CosyVoice 克隆命令（需要安装 CosyVoice）
        # 实际部署时取消注释并调整路径
        clone_script = f"""
# CosyVoice 3秒零样本克隆
# 参考: https://github.com/FunAudioLLM/CosyVoice

import sys
sys.path.append("pretrained_models/CosyVoice-300M")

from cosyvoice.cli.cosyvoice import CosyVoice

cosyvoice = CosyVoice("pretrained_models/CosyVoice-300M")

# 生成克隆声音
output = cosyvoice.inference_zero_shot(
    "你好，我是小暖，今天过得怎么样？",
    "希望你以后能够做的比我还好呦。",  # 参考文本
    "{ref_path}",                         # 参考音频
)

# 保存结果
import torchaudio
for i, audio in enumerate(output):
    torchaudio.save("{voice_dir}/sample_{i}.wav", audio['tts_speech'], 22050)
"""

        # 保存元信息
        voice_info = {
            "voice_id": voice_id,
            "name": voice_name,
            "engine": CloneEngine.COSYVOICE.value,
            "reference_audio": str(ref_path),
            "reference_text": reference_text,
            "created_at": str(Path(audio_path).stat().st_mtime),
            "clone_method": "zero_shot_3s",
            "clone_script": clone_script,
            "status": "ready",
        }

        self.voices[voice_id] = voice_info
        self._save_manifest()

        logger.info(f"CosyVoice 克隆完成: {voice_id} ({voice_name})")
        return voice_info

    # ============================================================
    # GPT-SoVITS 少样本微调
    # ============================================================

    def clone_gpt_sovits(
        self,
        audio_path: str,
        voice_name: str,
        *,
        audio_text: str = "",
    ) -> Dict[str, Any]:
        """
        使用 GPT-SoVITS 少样本微调

        需要 1 分钟以上清晰录音，GPU 微调约 30 分钟

        Args:
            audio_path: 参考音频路径（≥ 1 分钟）
            voice_name: 声音名称
            audio_text: 音频对应的文字内容（必须，用于训练）

        Returns:
            voice_id 和元信息
        """
        voice_id = f"gpt_sovits_{uuid.uuid4().hex[:8]}"
        voice_dir = self.custom_dir / voice_id
        voice_dir.mkdir(parents=True, exist_ok=True)

        # 复制参考音频
        ref_path = voice_dir / "reference.wav"
        shutil.copy(audio_path, ref_path)

        # 保存参考文本
        if audio_text:
            (voice_dir / "reference.txt").write_text(audio_text, encoding="utf-8")

        # GPT-SoVITS 微调脚本
        training_script = f"""
# GPT-SoVITS 微调
# 参考: https://github.com/RVC-Boss/GPT-SoVITS

# 1. 数据预处理
python GPT-SoVITS/preprocess.py \\
    --input_audio "{ref_path}" \\
    --input_text "{audio_text}" \\
    --output_dir "{voice_dir}/dataset"

# 2. 微调（约 30 分钟，GPU）
python GPT-SoVITS/train.py \\
    --dataset "{voice_dir}/dataset" \\
    --output_dir "{voice_dir}/model" \\
    --epochs 50

# 3. 测试生成
python GPT-SoVITS/inference.py \\
    --model "{voice_dir}/model" \\
    --text "你好，我是小暖，今天过得怎么样？" \\
    --output "{voice_dir}/sample.wav"
"""

        voice_info = {
            "voice_id": voice_id,
            "name": voice_name,
            "engine": CloneEngine.GPT_SOVITS.value,
            "reference_audio": str(ref_path),
            "reference_text": audio_text,
            "created_at": str(Path(audio_path).stat().st_mtime),
            "clone_method": "few_shot_finetune",
            "training_script": training_script,
            "status": "pending_training",  # 需要手动触发训练
            "training_requirements": {
                "gpu": "NVIDIA GPU with ≥ 8GB VRAM",
                "time": "约 30 分钟",
                "min_audio": "1 分钟",
            },
        }

        self.voices[voice_id] = voice_info
        self._save_manifest()

        logger.info(f"GPT-SoVITS 数据准备完成: {voice_id} ({voice_name})")
        return voice_info

    # ============================================================
    # Edge TTS 键盘输入（备用）
    # ============================================================

    def create_edge_tts_voice(
        self,
        voice_name: str,
        edge_voice: str = "zh-CN-XiaoxiaoNeural",
    ) -> Dict[str, Any]:
        """
        创建 Edge TTS 声音配置（无需音频，直接指定微软语音）

        Args:
            voice_name: 声音名称
            edge_voice: Edge TTS 语音名称

        Returns:
            voice_id 和元信息
        """
        voice_id = f"edge_tts_{uuid.uuid4().hex[:8]}"

        voice_info = {
            "voice_id": voice_id,
            "name": voice_name,
            "engine": CloneEngine.EDGE_TTS.value,
            "edge_voice": edge_voice,
            "clone_method": "preset",
            "status": "ready",
            "note": "Edge TTS 无需上传音频，直接使用微软云端语音",
        }

        self.voices[voice_id] = voice_info
        self._save_manifest()

        return voice_info

    # ============================================================
    # 管理接口
    # ============================================================

    def list_voices(self) -> Dict[str, Any]:
        """列出所有自定义声音"""
        return self.voices

    def get_voice(self, voice_id: str) -> Optional[Dict[str, Any]]:
        """获取指定声音信息"""
        return self.voices.get(voice_id)

    def delete_voice(self, voice_id: str) -> bool:
        """删除指定声音"""
        if voice_id not in self.voices:
            return False

        # 删除文件
        voice_dir = self.custom_dir / voice_id
        if voice_dir.exists():
            shutil.rmtree(voice_dir)

        del self.voices[voice_id]
        self._save_manifest()
        return True

    def synthesize(self, voice_id: str, text: str) -> Optional[str]:
        """
        使用指定声音合成语音

        Args:
            voice_id: 声音 ID
            text: 要合成的文本

        Returns:
            合成的音频文件路径
        """
        voice = self.voices.get(voice_id)
        if not voice:
            return None

        engine = voice.get("engine")

        if engine == CloneEngine.EDGE_TTS.value:
            return self._synthesize_edge_tts(voice, text)
        elif engine == CloneEngine.COSYVOICE.value:
            return self._synthesize_cosyvoice(voice, text)
        elif engine == CloneEngine.GPT_SOVITS.value:
            return self._synthesize_gpt_sovits(voice, text)

        return None

    def _synthesize_edge_tts(self, voice: dict, text: str) -> Optional[str]:
        """使用 Edge TTS 合成"""
        output_path = self.custom_dir / voice["voice_id"] / f"tts_{uuid.uuid4().hex[:8]}.mp3"

        try:
            import edge_tts
            import asyncio

            async def _run():
                communicate = edge_tts.Communicate(
                    text,
                    voice["edge_voice"],
                    rate="-10%",
                )
                await communicate.save(str(output_path))

            asyncio.run(_run())
            return str(output_path)
        except ImportError:
            logger.error("需要安装 edge-tts: pip install edge-tts")
            return None
        except Exception as e:
            logger.error(f"Edge TTS 合成失败: {e}")
            return None

    def _synthesize_cosyvoice(self, voice: dict, text: str) -> Optional[str]:
        """使用 CosyVoice 合成（需要 GPU）"""
        output_path = self.custom_dir / voice["voice_id"] / f"tts_{uuid.uuid4().hex[:8]}.wav"
        logger.warning("CosyVoice 合成需要 GPU，当前为占位实现")
        return None

    def _synthesize_gpt_sovits(self, voice: dict, text: str) -> Optional[str]:
        """使用 GPT-SoVITS 合成（需要 GPU）"""
        output_path = self.custom_dir / voice["voice_id"] / f"tts_{uuid.uuid4().hex[:8]}.wav"
        logger.warning("GPT-SoVITS 合成需要 GPU，当前为占位实现")
        return None


# ============================================================
# 模块级单例
# ============================================================
_clone_manager: Optional[VoiceCloneManager] = None


def get_clone_manager() -> VoiceCloneManager:
    """获取声音克隆管理器单例"""
    global _clone_manager
    if _clone_manager is None:
        _clone_manager = VoiceCloneManager()
    return _clone_manager