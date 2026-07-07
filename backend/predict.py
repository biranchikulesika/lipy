from __future__ import annotations

from typing import Any

import numpy as np
import tensorflow as tf
from fastapi import UploadFile

try:
    from .config import TOP_K
    from .model_loader import load_prediction_bundle
    from .preprocess import preprocess_image
except ImportError:
    from config import TOP_K
    from model_loader import load_prediction_bundle
    from preprocess import preprocess_image


def _normalize_probabilities(values: np.ndarray) -> np.ndarray:
    probabilities = np.asarray(values, dtype=np.float32)
    if probabilities.ndim == 1:
        probabilities = probabilities.reshape(1, -1)

    row_sums = probabilities.sum(axis=1)
    if not np.allclose(row_sums, 1.0, atol=1e-3):
        probabilities = tf.nn.softmax(probabilities, axis=-1).numpy()

    return probabilities


def predict_upload(upload: UploadFile) -> dict[str, Any]:
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise ValueError("Please upload a PNG or JPEG image.")

    image_bytes = upload.file.read()
    if not image_bytes:
        raise ValueError("Uploaded file is empty.")

    batch = preprocess_image(image_bytes)
    model, class_names, label_map = load_prediction_bundle()

    raw_output = model.predict(batch, verbose=0)
    probabilities = _normalize_probabilities(np.asarray(raw_output))
    scores = probabilities[0]

    # Map class name to character using the loaded label_map (character -> class_id)
    class_to_char = {v: k for k, v in label_map.items()}

    top_indices = np.argsort(scores)[::-1][:TOP_K]
    top_predictions: list[dict[str, Any]] = [
        {
            "label": class_names[index],
            "confidence": round(float(scores[index]), 4),
            "character": class_to_char.get(class_names[index], ""),
        }
        for index in top_indices
    ]

    return {
        "prediction": top_predictions[0]["label"],
        "confidence": top_predictions[0]["confidence"],
        "character": top_predictions[0]["character"],
        "top_predictions": top_predictions,
    }
