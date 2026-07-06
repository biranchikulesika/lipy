from __future__ import annotations

from io import BytesIO

import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

try:
    from .config import IMAGE_SIZE
except ImportError:
    from config import IMAGE_SIZE


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    if not image_bytes:
        raise ValueError("Empty image upload.")

    try:
        image = Image.open(BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image).convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Invalid or corrupted image file.") from exc

    rgb_array = np.array(image)
    resized = cv2.resize(rgb_array, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    normalized = resized.astype(np.float32) / 255.0
    return normalized.reshape(1, IMAGE_SIZE, IMAGE_SIZE, 3)
