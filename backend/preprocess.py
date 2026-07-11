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
    """
    Preprocess an uploaded image for LiPy OCR inference.

    Pipeline:
        1. Decode image.
        2. Correct EXIF orientation.
        3. Convert to RGB.
        4. Resize to IMAGE_SIZE × IMAGE_SIZE.
        5. Normalize pixel values.
        6. Add batch dimension.
    """

    if not image_bytes:
        raise ValueError("Empty image upload.")

    try:
        image = Image.open(BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")
    except UnidentifiedImageError as exc:
        raise ValueError("Invalid or corrupted image.") from exc

    image = np.asarray(image)

    image = cv2.resize(
        image,
        (IMAGE_SIZE, IMAGE_SIZE),
        interpolation=cv2.INTER_AREA,
    )

    image = image.astype(np.float32)
    image /= 255.0

    return np.expand_dims(image, axis=0)
