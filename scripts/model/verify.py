#!/usr/bin/env python3
"""Verify a local LiPy model bundle is compatible with the backend."""

from __future__ import annotations

import argparse
import json
import sys
import zipfile
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def validate_labels(labels_path: Path) -> list[dict[str, Any]]:
    with open(labels_path, "r", encoding="utf-8") as f:
        labels = json.load(f)
    if not isinstance(labels, list) or not labels:
        raise ValueError(f"{labels_path} must contain a non-empty label list.")

    for index, item in enumerate(labels):
        if not isinstance(item, dict):
            raise ValueError(f"{labels_path}[{index}] must be an object.")
        if not isinstance(item.get("id"), str) or not item["id"]:
            raise ValueError(f"{labels_path}[{index}].id must be a non-empty string.")
        if "char" in item and not isinstance(item["char"], str):
            raise ValueError(f"{labels_path}[{index}].char must be a string.")

    return labels


def iter_layers(config: dict[str, Any]) -> list[dict[str, Any]]:
    model_config = config.get("config", {})
    layers = model_config.get("layers", [])
    return layers if isinstance(layers, list) else []


def verify_keras_config(model_path: Path, label_count: int) -> None:
    try:
        with zipfile.ZipFile(model_path) as archive:
            config = json.loads(archive.read("config.json"))
    except Exception as exc:
        raise ValueError(f"could not read Keras config from {model_path}: {exc}") from exc

    input_shape = None
    output_classes = None
    for layer in iter_layers(config):
        layer_config = layer.get("config", {})
        if layer.get("class_name") == "InputLayer":
            input_shape = layer_config.get("batch_shape") or layer_config.get("batch_input_shape")
        if "units" in layer_config:
            output_classes = layer_config["units"]

    if input_shape is None or tuple(input_shape[-3:]) != (64, 64, 3):
        raise ValueError(f"model input shape {input_shape} does not match backend image shape (*, 64, 64, 3).")
    if output_classes != label_count:
        raise ValueError(f"model output classes ({output_classes}) do not match labels ({label_count}).")


def verify_with_tensorflow(model_path: Path, label_count: int) -> bool:
    try:
        from tensorflow.keras.models import load_model
    except ModuleNotFoundError:
        return False

    model = load_model(str(model_path), compile=False)
    output_shape = model.output_shape
    output_classes = output_shape[-1] if isinstance(output_shape, tuple) else output_shape[0][-1]
    if output_classes != label_count:
        raise ValueError(f"model output classes ({output_classes}) do not match labels ({label_count}).")

    input_shape = model.input_shape
    expected_tail = (64, 64, 3)
    input_tail = input_shape[-3:] if isinstance(input_shape, tuple) else input_shape[0][-3:]
    if tuple(input_tail) != expected_tail:
        raise ValueError(f"model input shape {input_shape} does not match backend image shape (*, 64, 64, 3).")

    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify model.keras and labels.json match the backend contract.")
    parser.add_argument("--model-dir", default=str(PROJECT_ROOT / "models"), help="Local model directory.")
    parser.add_argument("--skip-load", action="store_true", help="Skip TensorFlow model loading.")
    args = parser.parse_args()

    model_dir = Path(args.model_dir).resolve()
    model_path = model_dir / "model.keras"
    labels_path = model_dir / "labels.json"

    if not model_path.is_file():
        print(f"Error: missing {model_path}", file=sys.stderr)
        sys.exit(1)
    if model_path.stat().st_size == 0:
        print(f"Error: empty model file: {model_path}", file=sys.stderr)
        sys.exit(1)
    if not labels_path.is_file():
        print(f"Error: missing {labels_path}", file=sys.stderr)
        sys.exit(1)

    try:
        labels = validate_labels(labels_path)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)

    if not args.skip_load:
        try:
            loaded_with_tensorflow = verify_with_tensorflow(model_path, len(labels))
        except Exception as exc:
            print(f"Error: {exc}", file=sys.stderr)
            sys.exit(1)

        if not loaded_with_tensorflow:
            try:
                verify_keras_config(model_path, len(labels))
            except ValueError as exc:
                print(f"Error: {exc}", file=sys.stderr)
                sys.exit(1)
            print("TensorFlow is not installed; verified Keras config metadata instead.")

    print(f"Model OK: {model_path} ({model_path.stat().st_size} bytes), {len(labels)} labels.")


if __name__ == "__main__":
    main()
