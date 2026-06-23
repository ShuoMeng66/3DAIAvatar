"""
数字人形象预处理脚本
输入：原始图片 → 输出：预处理后的缓存文件

处理流程：
1. 人脸检测 + 对齐
2. 裁剪到 512×512
3. SadTalker 3DMM 参数提取（可选）
4. MuseTalk face embedding 缓存（可选）
"""

import os
import argparse
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def detect_face(image_path: str) -> dict:
    """
    人脸检测
    返回人脸位置、关键点

    依赖：pip install opencv-python mediapipe
    """
    try:
        import cv2
        import mediapipe as mp
    except ImportError:
        logger.error("请安装依赖: pip install opencv-python mediapipe")
        return {"error": "依赖未安装"}

    img = cv2.imread(image_path)
    if img is None:
        return {"error": f"无法读取图片: {image_path}"}

    h, w = img.shape[:2]

    mp_face = mp.solutions.face_detection
    with mp_face.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_detection.process(rgb)

        if not results.detections:
            return {"error": "未检测到人脸", "width": w, "height": h}

        detection = results.detections[0]
        bbox = detection.location_data.relative_bounding_box

        return {
            "success": True,
            "width": w,
            "height": h,
            "face_bbox": {
                "x": int(bbox.xmin * w),
                "y": int(bbox.ymin * h),
                "width": int(bbox.width * w),
                "height": int(bbox.height * h),
            },
            "confidence": detection.score[0] if hasattr(detection, 'score') else 1.0,
        }


def crop_face_centered(image_path: str, output_path: str, size: int = 512) -> bool:
    """
    人脸居中裁剪为正方形

    策略：
    1. 检测人脸位置
    2. 以人脸为中心扩展正方形
    3. 缩放至目标尺寸
    """
    try:
        import cv2
        import numpy as np
    except ImportError:
        logger.error("请安装: pip install opencv-python")
        return False

    img = cv2.imread(image_path)
    if img is None:
        return False

    h, w = img.shape[:2]

    # 尝试人脸检测
    face = detect_face(image_path)

    if "error" not in face:
        # 以人脸为中心
        bbox = face["face_bbox"]
        cx = bbox["x"] + bbox["width"] // 2
        cy = bbox["y"] + bbox["height"] // 2
        # 取人脸宽高的 2 倍作为正方形边长
        half = int(max(bbox["width"], bbox["height"]) * 1.2)
    else:
        # 未检测到人脸，取图片中心
        cx, cy = w // 2, h // 2
        half = min(w, h) // 2

    # 确保不越界
    x1 = max(0, cx - half)
    y1 = max(0, cy - half)
    x2 = min(w, cx + half)
    y2 = min(h, cy + half)

    # 裁剪
    cropped = img[y1:y2, x1:x2]

    # 缩放至目标尺寸
    result = cv2.resize(cropped, (size, size))

    # 保存
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(output_path, result)

    logger.info(f"人脸居中裁剪完成: {output_path}")
    return True


def generate_muse_embedding(image_path: str, output_path: str) -> bool:
    """
    生成 MuseTalk face embedding 缓存

    依赖：MuseTalk 模型权重
    """
    logger.warning("MuseTalk embedding 生成需要 GPU 和 MuseTalk 模型")
    logger.warning(f"请手动运行: python -m musetalk.preprocess --input {image_path} --output {output_path}")
    return False


def generate_sadtalker_cache(image_path: str, output_dir: str) -> bool:
    """
    生成 SadTalker 3DMM 参数缓存

    依赖：SadTalker 模型权重
    """
    logger.warning("SadTalker 缓存生成需要 GPU 和 SadTalker 模型")
    logger.warning(f"请手动运行: python SadTalker/src/utils/preprocess.py --input {image_path} --output {output_dir}")
    return False


def main():
    parser = argparse.ArgumentParser(description="数字人形象预处理")
    parser.add_argument("--input", required=True, help="输入图片路径")
    parser.add_argument("--output", required=True, help="输出目录")
    parser.add_argument("--size", type=int, default=512, help="输出尺寸")
    parser.add_argument("--muse", action="store_true", help="生成 MuseTalk embedding")
    parser.add_argument("--sadtalker", action="store_true", help="生成 SadTalker 缓存")

    args = parser.parse_args()

    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. 人脸检测
    logger.info("检测人脸...")
    face_info = detect_face(args.input)
    logger.info(f"人脸检测结果: {face_info}")

    # 2. 人脸居中裁剪
    cropped_path = output_dir / "face_512.png"
    if crop_face_centered(args.input, str(cropped_path), args.size):
        logger.info(f"裁剪完成: {cropped_path}")

    # 3. MuseTalk embedding（可选）
    if args.muse:
        logger.info("生成 MuseTalk embedding...")
        generate_muse_embedding(str(cropped_path), str(output_dir / "muse_embedding.npy"))

    # 4. SadTalker 缓存（可选）
    if args.sadtalker:
        logger.info("生成 SadTalker 缓存...")
        generate_sadtalker_cache(str(cropped_path), str(output_dir))

    logger.info("预处理完成")


if __name__ == "__main__":
    main()