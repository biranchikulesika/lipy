from __future__ import annotations

import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent if (BASE_DIR.parent / "scripts").exists() else BASE_DIR
MODEL_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_FILENAME = "model.keras"
DEFAULT_MODEL_PATH = MODEL_DIR / DEFAULT_MODEL_FILENAME
IMAGE_SIZE = 64
TOP_K = 3


def get_model_path() -> Path:
    override = os.getenv("LIPY_MODEL_PATH")
    if override:
        return Path(override).expanduser().resolve()

    return DEFAULT_MODEL_PATH


def get_allowed_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return ["*"]
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["*"]
