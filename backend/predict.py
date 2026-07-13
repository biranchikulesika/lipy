from __future__ import annotations

from typing import Any

import numpy as np
import tensorflow as tf
from fastapi import UploadFile

try:
    from .config import (
        AMBIGUOUS_MARGIN,
        LOW_CONFIDENCE_THRESHOLD,
        TOP_K,
    )
    from .model_loader import load_prediction_bundle
    from .preprocess import preprocess_image
except ImportError:
    from config import (
        AMBIGUOUS_MARGIN,
        LOW_CONFIDENCE_THRESHOLD,
        TOP_K,
    )
    from model_loader import load_prediction_bundle
    from preprocess import preprocess_image


def evaluate_prediction(
    top_predictions: list[dict[str, Any]],
) -> tuple[str, str | None]:
    """
    Determine the prediction status based on confidence thresholds.

    Parameters
    ----------
    top_predictions : list[dict]
        List of top predictions sorted by confidence descending.
        Each dict must include "confidence" and optionally "label" and "character".

    Returns
    -------
    tuple[str, str | None]
        (status, reason) where status is one of
        "success", "low_confidence", or "ambiguous".
    """

    top_confidence = top_predictions[0]["confidence"]

    # Low confidence: the model is not confident enough.
    if top_confidence < LOW_CONFIDENCE_THRESHOLD:
        return "low_confidence", "confidence_below_threshold"

    # Ambiguous: top two predictions are too close.
    if len(top_predictions) >= 2:
        margin = top_predictions[0]["confidence"] - top_predictions[1]["confidence"]
        if margin < AMBIGUOUS_MARGIN:
            return "ambiguous", "top_predictions_too_close"

    return "success", None


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
                "character": label_map.get(
                    class_name,
                    "",
                ),
            }
        )

    # Determine prediction status from confidence values.
    status, reason = evaluate_prediction(top_predictions)

    if status == "success":
        return {
            "status": status,
            "prediction": top_predictions[0]["label"],
            "character": top_predictions[0]["character"],
            "confidence": top_predictions[0]["confidence"],
            "reason": reason,
            "top_predictions": top_predictions,
        }

    # Non-successful predictions: return null prediction/character
    # but preserve top_predictions for optional frontend display.
    return {
        "status": status,
        "prediction": None,
        "character": None,
        "confidence": top_predictions[0]["confidence"],
        "reason": reason,
        "top_predictions": top_predictions,
    }