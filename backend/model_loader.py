from __future__ import annotations

import json
from functools import lru_cache

from tensorflow.keras.models import load_model

try:
    from .config import (
        get_labels_path,
        get_model_path,
    )
except ImportError:
    from config import (
        get_labels_path,
        get_model_path,
    )


@lru_cache(maxsize=1)
def load_prediction_bundle() -> tuple:
    """
    Load the TensorFlow model together with its label metadata.

    Returns
    -------
    tuple
        (
            model,
            class_names,
            label_map,
        )
    """

    model_path = get_model_path()
    labels_path = get_labels_path()

    if not model_path.exists():
        raise FileNotFoundError(
            f"TensorFlow model not found:\n"
            f"{model_path}\n\n"
            f"Run 'python backend/download_model.py' or "
            f"set the LIPY_MODEL_PATH environment variable."
        )

    if not labels_path.exists():
        raise FileNotFoundError(
            f"Label metadata not found:\n"
            f"{labels_path}\n\n"
            f"Every model must be accompanied by a labels.json file."
        )

    model = load_model(str(model_path), compile=False)

    with open(labels_path, "r", encoding="utf-8") as file:
        labels_data = json.load(file)

    class_names = [item["id"] for item in labels_data]

    label_map = {
        item["char"]: item["id"]
        for item in labels_data
        if item.get("char")
    }

    expected_classes = model.output_shape[-1]

    if len(class_names) != expected_classes:
        raise ValueError(
            "Model validation failed.\n\n"
            f"Model outputs : {expected_classes}\n"
            f"labels.json   : {len(class_names)} classes\n\n"
            "The model and labels.json do not match."
        )

    return (
        model,
        class_names,
        label_map,
    )