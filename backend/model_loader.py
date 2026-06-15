from __future__ import annotations

from functools import lru_cache
from typing import Dict, List

from tensorflow.keras.models import load_model

try:
    from .config import get_model_path
    from .labels import odia_ml_labels
except ImportError:
    from config import get_model_path
    from labels import odia_ml_labels


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
            f"Place the trained model there or set LIPY_MODEL_PATH."
        )

    model = load_model(str(model_path), compile=False)

    class_names = get_class_names()
    label_map = get_label_map()

    return model, class_names, label_map
