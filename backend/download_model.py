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
    from .config import (
        DEFAULT_MODEL_REPO_ID,
        MODEL_DIR,
    )
except ImportError:
    from config import (
        DEFAULT_MODEL_REPO_ID,
        MODEL_DIR,
    )


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

    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

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
        "model.keras"
        if "model.keras" in keras_files
        else keras_files[0]
    )

    stem = Path(model_name).stem

    label_candidates = [
        "labels.json",
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

    shutil.copyfile(
        model_path,
        output_dir / "model.keras",
    )

    shutil.copyfile(
        labels_path,
        output_dir / "labels.json",
    )

    print()

    print("LiPy model downloaded successfully.\n")

    print(f"Model  : {output_dir / 'model.keras'}")
    print(f"Labels : {output_dir / 'labels.json'}")


if __name__ == "__main__":
    main()