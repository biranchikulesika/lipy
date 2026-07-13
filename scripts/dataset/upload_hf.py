#!/usr/bin/env python3
"""Commit and push the nested dataset repo to Hugging Face."""

from __future__ import annotations

import argparse
import os
import sys
import zipfile
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))
from scripts.common.git_utils import commit_and_push, ensure_nested_repo, run_git  # noqa: E402


PROJECT_ROOT = Path(__file__).resolve().parents[2]
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}


def zip_samples(dataset_dir: Path) -> None:
    """Zip all images from complete_dataset/ into complete_dataset.zip at the dataset root."""
    complete_dir = dataset_dir / "complete_dataset"
    if not complete_dir.is_dir():
        print(f"No complete_dataset/ directory found in {dataset_dir}, skipping zip.")
        return

    images = [f for f in complete_dir.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS]
    if not images:
        print("No sample images found in complete_dataset/, skipping zip.")
        return

    zip_path = dataset_dir / "complete_dataset.zip"
    print(f"Creating {zip_path.name} with {len(images)} samples...")

    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for img in images:
                zf.write(img, f"complete_dataset/{img.name}")
        print(f"Created {zip_path.name} ({zip_path.stat().st_size:,} bytes).")
    except OSError as e:
        print(f"Warning: zip failed ({e}), proceeding without zip.", file=sys.stderr)
        if zip_path.exists():
            zip_path.unlink()


def main() -> None:
    parser = argparse.ArgumentParser(description="Commit and push dataset/ to a Hugging Face Dataset repo.")
    parser.add_argument("--repo-id", default=os.getenv("HF_DATASET_REPO_ID", "biranchikulesika/lipy"), help="Hugging Face dataset repo id.")
    parser.add_argument(
        "--dataset-dir",
        default=str(PROJECT_ROOT / "dataset"),
        help="Local nested Git working copy for the dataset repo.",
    )
    parser.add_argument("--message", default="Upload LiPy dataset snapshot", help="Hub commit message.")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    ensure_nested_repo(dataset_dir, args.repo_id, "dataset")

    # Pull before push to avoid conflicts
    print("Pulling latest changes from remote...")
    run_git(["pull", "--rebase"], dataset_dir, retries=3)

    zip_samples(dataset_dir)
    commit_and_push(dataset_dir, args.message)


if __name__ == "__main__":
    main()
