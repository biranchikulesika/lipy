from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

from tensorflow.keras.models import load_model

from labels import odia_ml_labels


# backend directory
BASE_DIR = Path(__file__).resolve().parent

# backend/models/odia_ocr_cnn.keras
DEFAULT_MODEL_PATH = BASE_DIR / "models" / "odia_ocr_cnn.keras"


def get_model_path() -> Path:
    override = os.getenv("LIPI_MODEL_PATH")

    if override:
        return Path(override).expanduser().resolve()

    return DEFAULT_MODEL_PATH


def get_label_map() -> Dict[str, str]:
    return dict(odia_ml_labels)


def get_class_names() -> List[str]:
    return list(odia_ml_labels.values())


@lru_cache(maxsize=1)
def load_prediction_bundle() -> tuple:
    model_path = get_model_path()

    if not model_path.exists():
        raise FileNotFoundError(
            f"TensorFlow model not found at {model_path}. "
            f"Place the trained model there or set LIPI_MODEL_PATH."
        )

    model = load_model(str(model_path), compile=False)

    class_names = get_class_names()
    label_map = get_label_map()

    return model, class_names, label_map
