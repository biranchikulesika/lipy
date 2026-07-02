from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
DEFAULT_MODEL_FILENAME = "odia_ocr_cnn.keras"
DEFAULT_MODEL_PATH = MODEL_DIR / DEFAULT_MODEL_FILENAME
IMAGE_SIZE = 64
TOP_K = 3


def get_model_path() -> Path:
    override = os.getenv("LIPY_MODEL_PATH")
    if override:
        return Path(override).expanduser().resolve()
    
    keras_files = list(MODEL_DIR.glob("*.keras"))
    if not keras_files:
        return DEFAULT_MODEL_PATH
        
    keras_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return keras_files[0]


def get_allowed_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return ["*"]
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["*"]
