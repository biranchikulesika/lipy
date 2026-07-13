#!/usr/bin/env python3
"""Upload models/ to Hugging Face via the HF CLI."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_FILES = ("model.keras", "labels.json")


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
        "--include", "model.keras",
        "--include", "labels.json",
        "--include", "training_history.json",
        "--include", "README.md",
    ]
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=local_dir)
    if result.returncode != 0:
        print(f"Error: hf upload failed with exit code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload models/ to a Hugging Face Model repo.")
    parser.add_argument("--repo-id", default=os.getenv("HF_MODEL_REPO_ID", "biranchikulesika/lipy"), help="Hugging Face model repo id.")
    parser.add_argument("--model-dir", default=str(PROJECT_ROOT / "models"), help="Local model directory.")
    parser.add_argument("--message", default="Upload LiPy model artifacts", help="Hub commit message.")
    args = parser.parse_args()

    model_dir = Path(args.model_dir).resolve()
    if not model_dir.is_dir():
        print(f"Error: {model_dir} does not exist.", file=sys.stderr)
        sys.exit(1)

    missing = [name for name in REQUIRED_FILES if not (model_dir / name).is_file()]
    if missing:
        print(f"Error: missing required model artifacts: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    check_hf_auth()
    upload_to_hf(model_dir, args.repo_id, "model", args.message)


if __name__ == "__main__":
    main()
