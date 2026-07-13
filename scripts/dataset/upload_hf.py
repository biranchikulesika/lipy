#!/usr/bin/env python3
"""Upload dataset/ to Hugging Face via the HF CLI."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import zipfile
from pathlib import Path


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


def check_hf_auth() -> None:
    """Verify Hugging Face CLI is authenticated."""
    result = subprocess.run(["hf", "auth", "whoami"], capture_output=True, text=True)
    if result.returncode != 0:
        print("Error: Hugging Face CLI is not authenticated.", file=sys.stderr)
        print("Run the following command to log in:", file=sys.stderr)
        print("  hf auth login", file=sys.stderr)
        sys.exit(1)


def upload_to_hf(local_dir: Path, repo_id: str, repo_type: str, message: str) -> None:
    """Run hf upload to push files to Hugging Face."""
    cmd = [
        "hf", "upload", repo_id,
        str(local_dir), ".",
        "--repo-type", repo_type,
        "--commit-message", message,
        "--include", "complete_dataset/**",
        "--include", "mini_dataset/**",
        "--include", "*.zip",
        "--include", "README.md",
    ]
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=local_dir)
    if result.returncode != 0:
        print(f"Error: hf upload failed with exit code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload dataset/ to a Hugging Face Dataset repo.")
    parser.add_argument("--repo-id", default=os.getenv("HF_DATASET_REPO_ID", "biranchikulesika/lipy"), help="Hugging Face dataset repo id.")
    parser.add_argument("--dataset-dir", default=str(PROJECT_ROOT / "dataset"), help="Local dataset directory.")
    parser.add_argument("--message", default="Upload LiPy dataset snapshot", help="Hub commit message.")
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    if not dataset_dir.is_dir():
        print(f"Error: {dataset_dir} does not exist.", file=sys.stderr)
        sys.exit(1)

    check_hf_auth()
    zip_samples(dataset_dir)
    upload_to_hf(dataset_dir, args.repo_id, "dataset", args.message)


if __name__ == "__main__":
    main()
