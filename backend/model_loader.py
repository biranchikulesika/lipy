from __future__ import annotations

import json
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
    model_path = get_model_path()
    labels_path = model_path.with_suffix(".labels.json")
    classes_path = model_path.with_suffix(".classes.txt")

    if labels_path.exists():
        with open(labels_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [item["id"] for item in data]
    elif classes_path.exists():
        with open(classes_path, "r", encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]
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

    labels_path = model_path.with_suffix(".labels.json")
    classes_path = model_path.with_suffix(".classes.txt")

    if labels_path.exists():
        with open(labels_path, "r", encoding="utf-8") as f:
            labels_data = json.load(f)
        class_names = [item["id"] for item in labels_data]
        # Construct label map dynamically: maps character -> class_id
        label_map = {item["char"]: item["id"] for item in labels_data if item["char"]}
    elif classes_path.exists():
        with open(classes_path, "r", encoding="utf-8") as f:
            class_names = [line.strip() for line in f if line.strip()]
        # Fall back to hardcoded label map
        label_map = get_label_map()
    else:
        raise FileNotFoundError(
            f"Label metadata file not found. "
            f"Please make sure the trained model is accompanied by either "
            f"a '{labels_path.name}' file or a '{classes_path.name}' file next to the model."
        )

    # Validation step: check if class count matches model output size
    expected_classes = model.output_shape[-1]
    if len(class_names) != expected_classes:
        raise ValueError(
            f"Validation Mismatch: Loaded classes count ({len(class_names)}) does not match "
            f"the model's expected output size ({expected_classes}) for model at {model_path}."
        )

    return model, class_names, label_map


