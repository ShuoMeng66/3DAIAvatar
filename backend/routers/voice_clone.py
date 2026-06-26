"""
声音克隆 API 端点
POST /api/v1/voice/clone  — 上传录音 → 克隆声音
GET  /api/v1/voice/list    — 列出所有自定义声音
POST /api/v1/voice/tts     — 使用指定声音合成语音
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import tempfile
import logging

from voice_clone import get_clone_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/voice", tags=["voice"])


class TTSRequest(BaseModel):
    voice_id: str
    text: str


@router.post("/clone")
async def clone_voice(
    audio: UploadFile = File(...),
    voice_name: str = Form("我的声音"),
    engine: str = Form("cosyvoice"),
    reference_text: str = Form(""),
):
    """
    上传录音，克隆声音

    - **audio**: 录音文件（WAV/MP3/M4A）
    - **voice_name**: 声音名称
    - **engine**: 克隆引擎（cosyvoice / gpt_sovits / edge_tts）
    - **reference_text**: 参考音频的文字内容（可选，提高克隆质量）
    """
    manager = get_clone_manager()

    # 保存上传文件到临时目录
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        content = await audio.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        # 音频预处理
        preprocess_result = manager.preprocess_audio(tmp_path, tempfile.gettempdir())

        if "error" in preprocess_result:
            raise HTTPException(status_code=400, detail=preprocess_result["error"])

        processed_path = preprocess_result["output_path"]
        duration = preprocess_result["duration"]

        # 根据引擎选择克隆方法
        if engine == "cosyvoice":
            if duration < 1:
                raise HTTPException(400, "音频太短，至少需要 1 秒")
            result = manager.clone_cosyvoice(processed_path, voice_name, reference_text=reference_text)

        elif engine == "gpt_sovits":
            if duration < 30:
                raise HTTPException(400, f"GPT-SoVITS 需要至少 30 秒音频，当前 {duration:.1f} 秒")
            result = manager.clone_gpt_sovits(processed_path, voice_name, audio_text=reference_text)

        elif engine == "edge_tts":
            result = manager.create_edge_tts_voice(voice_name)

        else:
            raise HTTPException(400, f"不支持的引擎: {engine}")

        return JSONResponse({
            "status": "ok",
            "voice_id": result["voice_id"],
            "name": result["name"],
            "engine": result["engine"],
            "duration": duration,
            "message": f"声音克隆成功！voice_id: {result['voice_id']}",
        })

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"声音克隆失败: {e}")
        raise HTTPException(500, f"声音克隆失败: {str(e)}")
    finally:
        # 清理临时文件
        import os
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


@router.get("/list")
async def list_voices():
    """列出所有自定义声音"""
    manager = get_clone_manager()
    voices = manager.list_voices()
    return JSONResponse({"status": "ok", "voices": voices})


@router.post("/tts")
async def synthesize_voice(req: TTSRequest):
    """
    使用指定声音合成语音

    - **voice_id**: 声音 ID
    - **text**: 要合成的文本
    """
    manager = get_clone_manager()
    voice = manager.get_voice(req.voice_id)
    if not voice:
        raise HTTPException(404, f"声音不存在: {req.voice_id}")

    output_path = manager.synthesize(req.voice_id, req.text)
    if not output_path:
        raise HTTPException(500, "语音合成失败")

    return JSONResponse({
        "status": "ok",
        "voice_id": req.voice_id,
        "output_path": output_path,
    })