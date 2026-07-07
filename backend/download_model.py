#!/usr/bin/env python3
"""Download the latest LiPy model artifacts for backend runtime."""

from __future__ import annotations

import argparse
import os
import shutil
import sys
from pathlib import Path

from huggingface_hub import HfApi, hf_hub_download


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent if (BASE_DIR.parent / "scripts").exists() else BASE_DIR
DEFAULT_MODEL_REPO_ID = "biranchikulesika/lipy"


def main() -> None:
    parser = argparse.ArgumentParser(description="Download model.keras and labels.json for the backend.")
    parser.add_argument(
        "--repo-id",
        default=os.getenv("HF_MODEL_REPO_ID", DEFAULT_MODEL_REPO_ID),
        help="Hugging Face model repo id.",
    )
    parser.add_argument("--revision", default=os.getenv("HF_MODEL_REVISION"), help="Branch, tag, or commit to download.")
    parser.add_argument("--output-dir", default=str(PROJECT_ROOT / "models"), help="Backend model directory.")
    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    token = os.getenv("HF_TOKEN")
    api = HfApi(token=token)
    files = api.list_repo_files(repo_id=args.repo_id, repo_type="model", revision=args.revision)

    keras_files = sorted([name for name in files if name.endswith(".keras")], reverse=True)
    if not keras_files:
        print(f"Error: no .keras model file found in {args.repo_id}.", file=sys.stderr)
        sys.exit(1)

    source_model_name = "model.keras" if "model.keras" in keras_files else keras_files[0]
    source_model_stem = Path(source_model_name).stem
    label_candidates = [
        "labels.json",
        f"{source_model_stem}.labels.json",
        source_model_name.replace(".keras", ".labels.json"),
    ]
    source_labels_name = next((name for name in label_candidates if name in files), None)
    if not source_labels_name:
        print(f"Error: no labels.json or matching .labels.json file found in {args.repo_id}.", file=sys.stderr)
        sys.exit(1)

    model_cache_path = hf_hub_download(
        repo_id=args.repo_id,
        repo_type="model",
        revision=args.revision,
        filename=source_model_name,
        token=token,
    )
    labels_cache_path = hf_hub_download(
        repo_id=args.repo_id,
        repo_type="model",
        revision=args.revision,
        filename=source_labels_name,
        token=token,
    )

    shutil.copyfile(model_cache_path, output_dir / "model.keras")
    shutil.copyfile(labels_cache_path, output_dir / "labels.json")

    print(f"Downloaded {source_model_name} -> {output_dir / 'model.keras'}")
    print(f"Downloaded {source_labels_name} -> {output_dir / 'labels.json'}")


if __name__ == "__main__":
    main()
