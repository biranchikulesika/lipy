#!/usr/bin/env python3
"""Bootstrap nested local data/model working copies."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET_FOLDER = PROJECT_ROOT / "dataset" / "complete_dataset"
MODEL_PATH = PROJECT_ROOT / "models" / "model.keras"


def has_files(path: Path) -> bool:
    return path.exists() and any(item.name != ".cache" for item in path.iterdir())


def is_git_worktree(path: Path) -> bool:
    if not path.exists():
        return False
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=path,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return False
    return Path(result.stdout.strip()).resolve() == path.resolve()


def run_script(relative_path: str) -> None:
    script_path = PROJECT_ROOT / relative_path
    subprocess.run([sys.executable, str(script_path)], cwd=PROJECT_ROOT, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Download missing dataset/ and models/ working copies.")
    parser.parse_args()

    dataset_root = PROJECT_ROOT / "dataset"
    model_root = PROJECT_ROOT / "models"

    if has_files(DEFAULT_DATASET_FOLDER) and is_git_worktree(dataset_root):
        print("Dataset already exists; skipping Hugging Face dataset download.")
    else:
        print("Dataset missing or not a nested repo; preparing Hugging Face dataset repo.")
        run_script("scripts/dataset/download_hf.py")

    if MODEL_PATH.is_file() and is_git_worktree(model_root):
        print("Model already exists; skipping Hugging Face model download.")
    else:
        print("Model missing or not a nested repo; preparing Hugging Face model repo.")
        run_script("scripts/model/download_hf.py")

    print("✓ Dataset repository ready\n✓ Model repository ready\n\nProject initialization completed.\n\nNext steps:\n\n1. Train the model\n2. Start the backend\n3. Start the frontend")


if __name__ == "__main__":
    main()
