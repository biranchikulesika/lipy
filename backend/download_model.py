#!/usr/bin/env python3
"""Download the latest LiPy model artifacts from Hugging Face."""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

from huggingface_hub import HfApi, hf_hub_download

try:
    from .config import DEFAULT_MODEL_REPO_ID, MODEL_DIR
except ImportError:
    from config import DEFAULT_MODEL_REPO_ID, MODEL_DIR


MODEL_FILE = "model.keras"
LABELS_FILE = "labels.json"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download LiPy model artifacts."
    )

    parser.add_argument(
        "--repo-id",
        default=os.getenv(
            "HF_MODEL_REPO_ID",
            DEFAULT_MODEL_REPO_ID,
        ),
        help="Hugging Face model repository.",
    )

    parser.add_argument(
        "--revision",
        default=os.getenv("HF_MODEL_REVISION"),
        help="Repository branch, tag or commit.",
    )

    parser.add_argument(
        "--output-dir",
        default=str(MODEL_DIR),
        help="Directory where model files will be stored.",
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Force download even if model already exists.",
    )

    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    model_dest = output_dir / MODEL_FILE
    labels_dest = output_dir / LABELS_FILE

    # -------------------------------------------------------------
    # Skip download if files already exist
    # -------------------------------------------------------------
    if (
        not args.force
        and model_dest.exists()
        and labels_dest.exists()
    ):
        print("✓ Local model already exists.")
        print(f"Model  : {model_dest}")
        print(f"Labels : {labels_dest}")
        return

    print("Downloading latest model from Hugging Face...")

    token = os.getenv("HF_TOKEN")

    api = HfApi(token=token)

    files = api.list_repo_files(
        repo_id=args.repo_id,
        repo_type="model",
        revision=args.revision,
    )

    keras_files = sorted(
        (
            file
            for file in files
            if file.endswith(".keras")
        ),
        reverse=True,
    )

    if not keras_files:
        print(
            f"Error: No .keras model found in '{args.repo_id}'.",
            file=sys.stderr,
        )
        sys.exit(1)

    model_name = (
        MODEL_FILE
        if MODEL_FILE in keras_files
        else keras_files[0]
    )

    stem = Path(model_name).stem

    label_candidates = [
        LABELS_FILE,
        f"{stem}.labels.json",
        model_name.replace(".keras", ".labels.json"),
    ]

    labels_name = next(
        (
            name
            for name in label_candidates
            if name in files
        ),
        None,
    )

    if labels_name is None:
        print(
            "Error: labels.json not found.",
            file=sys.stderr,
        )
        sys.exit(1)

    model_path = hf_hub_download(
        repo_id=args.repo_id,
        repo_type="model",
        revision=args.revision,
        filename=model_name,
        token=token,
    )

    labels_path = hf_hub_download(
        repo_id=args.repo_id,
        repo_type="model",
        revision=args.revision,
        filename=labels_name,
        token=token,
    )

    shutil.copy2(model_path, model_dest)
    shutil.copy2(labels_path, labels_dest)

    print()
    print("✓ LiPy model downloaded successfully.\n")
    print(f"Model  : {model_dest}")
    print(f"Labels : {labels_dest}")


if __name__ == "__main__":
    main()