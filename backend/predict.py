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


def normalize_probabilities(values: np.ndarray) -> np.ndarray:
    """
    Ensure prediction outputs represent valid probability distributions.
    """

    probabilities = np.asarray(values, dtype=np.float32)

    if probabilities.ndim == 1:
        probabilities = probabilities.reshape(1, -1)

    if not np.allclose(
        probabilities.sum(axis=1),
        1.0,
        atol=1e-3,
    ):
        probabilities = tf.nn.softmax(
            probabilities,
            axis=-1,
        ).numpy()

    return probabilities


def predict_upload(upload: UploadFile) -> dict[str, Any]:
    """
    Predict the handwritten Odia character contained in an uploaded image.
    """

    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise ValueError("Please upload a PNG or JPEG image.")

    image_bytes = upload.file.read()

    if not image_bytes:
        raise ValueError("Uploaded file is empty.")

    batch = preprocess_image(image_bytes)

    model, class_names, label_map = load_prediction_bundle()

    probabilities = normalize_probabilities(
        model.predict(batch, verbose=0)
    )[0]

    class_to_character = {
        value: key
        for key, value in label_map.items()
    }

    top_indices = np.argsort(probabilities)[::-1][:TOP_K]

    top_predictions = []

    for index in top_indices:

        class_name = class_names[index]

        top_predictions.append(
            {
                "label": class_name,
                "confidence": round(
                    float(probabilities[index]),
                    4,
                ),
                "character": class_to_character.get(
                    class_name,
                    "",
                ),
            }
        )

    return {
        "prediction": top_predictions[0]["label"],
        "confidence": top_predictions[0]["confidence"],
        "character": top_predictions[0]["character"],
        "top_predictions": top_predictions,
    }