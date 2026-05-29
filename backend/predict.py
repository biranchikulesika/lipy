from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Dict, List

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
import tensorflow as tf
from fastapi import UploadFile

from backend.model_loader import load_prediction_bundle
from backend.preprocess import preprocess_image


def _normalize_probabilities(values: np.ndarray) -> np.ndarray:
    probabilities = np.asarray(values, dtype=np.float32)
    if probabilities.ndim == 1:
        probabilities = probabilities.reshape(1, -1)

    row_sums = probabilities.sum(axis=1)
    if not np.allclose(row_sums, 1.0, atol=1e-3):
        probabilities = tf.nn.softmax(probabilities, axis=-1).numpy()

    return probabilities


def predict_upload(upload: UploadFile) -> Dict[str, Any]:
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise ValueError("Please upload a PNG or JPEG image.")

    image_bytes = upload.file.read()
    if not image_bytes:
        raise ValueError("Uploaded file is empty.")

    batch = preprocess_image(image_bytes)
    model, class_names, _ = load_prediction_bundle()

    raw_output = model.predict(batch, verbose=0)
    probabilities = _normalize_probabilities(np.asarray(raw_output))
    scores = probabilities[0]

    top_indices = np.argsort(scores)[::-1][:3]
    top_predictions: List[Dict[str, Any]] = [
        {
            "label": class_names[index],
            "confidence": round(float(scores[index]), 4),
        }
        for index in top_indices
    ]

    return {
        "prediction": top_predictions[0]["label"],
        "confidence": top_predictions[0]["confidence"],
        "top_predictions": top_predictions,
    }
