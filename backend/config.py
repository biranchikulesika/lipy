from __future__ import annotations

import os
from pathlib import Path

# =============================================================================
# Project Paths
# =============================================================================

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent if (BASE_DIR.parent / "scripts").exists() else BASE_DIR

# =============================================================================
# Model Configuration
# =============================================================================

MODEL_DIR = PROJECT_ROOT / "models"

DEFAULT_MODEL_FILENAME = "model.keras"
DEFAULT_LABELS_FILENAME = "labels.json"

DEFAULT_MODEL_PATH = MODEL_DIR / DEFAULT_MODEL_FILENAME
DEFAULT_LABELS_PATH = MODEL_DIR / DEFAULT_LABELS_FILENAME

DEFAULT_MODEL_REPO_ID = "biranchikulesika/lipy"

# =============================================================================
# Image Configuration
# =============================================================================

IMAGE_SIZE = 64

# =============================================================================
# API Configuration
# =============================================================================

API_TITLE = "LiPy OCR API"

API_DESCRIPTION = (
    "FastAPI backend for handwritten Odia character recognition."
)

API_VERSION = "1.0.0"


# =============================================================================
# Prediction Configuration
# =============================================================================

# Number of highest-confidence predictions returned by the API.
TOP_K = 3

# Minimum confidence for a prediction to be considered reliable.
# If the top prediction's confidence is below this threshold,
# the API returns a "low_confidence" status.
LOW_CONFIDENCE_THRESHOLD = 0.95

# Minimum margin between the top two predictions for the result
# to be considered unambiguous. If the difference is smaller,
# the API returns an "ambiguous" status.
AMBIGUOUS_MARGIN = 0.10


# =============================================================================
# Helper Functions
# =============================================================================

def get_model_path() -> Path:
    """Return the TensorFlow model path."""

    override = os.getenv("LIPY_MODEL_PATH")

    if override:
        return Path(override).expanduser().resolve()

    return DEFAULT_MODEL_PATH


def get_labels_path() -> Path:
    """Return the labels.json path."""

    return get_model_path().parent / DEFAULT_LABELS_FILENAME


def get_allowed_origins() -> list[str]:
    """Return configured CORS origins."""

    raw = os.getenv("CORS_ORIGINS")

    if not raw:
        return ["*"]

    origins = [
        origin.strip()
        for origin in raw.split(",")
        if origin.strip()
    ]

    return origins or ["*"]