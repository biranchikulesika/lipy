#!/usr/bin/env python3
"""Set up LiPy folder structure after cloning from GitHub."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = PROJECT_ROOT / "dataset"
COMPLETE_DATASET_DIR = DATASET_DIR / "complete_dataset"
MODELS_DIR = PROJECT_ROOT / "models"

DATASET_REPO_ID = "biranchikulesika/lipy"
MODEL_REPO_ID = "biranchikulesika/lipy"


def is_git_repo(path: Path) -> bool:
    """Check if path is the root of a Git repository."""
    if not path.exists():
        return False
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            cwd=path,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            check=False,
            timeout=10,
        )
        if result.returncode != 0:
            return False
        return Path(result.stdout.strip()).resolve() == path.resolve()
    except (subprocess.TimeoutExpired, OSError):
        return False


def init_hf_repo(local_dir: Path, repo_id: str, repo_type: str) -> None:
    """Initialize a directory as a nested HF git working copy."""
    local_dir.mkdir(parents=True, exist_ok=True)
    if is_git_repo(local_dir):
        return

    print(f"  Initializing {local_dir.name}/ as HF {repo_type} repo...")
    url = f"https://huggingface.co/datasets/{repo_id}" if repo_type == "dataset" else f"https://huggingface.co/{repo_id}"
    subprocess.run(["git", "init"], cwd=local_dir, check=True)
    subprocess.run(["git", "remote", "add", "origin", url], cwd=local_dir, check=True)


def main() -> None:
    print("LiPy Project Setup")
    print("=" * 40)

    print("\n[1/2] Setting up dataset/...")
    init_hf_repo(DATASET_DIR, DATASET_REPO_ID, "dataset")
    COMPLETE_DATASET_DIR.mkdir(parents=True, exist_ok=True)

    print("[2/2] Setting up models/...")
    init_hf_repo(MODELS_DIR, MODEL_REPO_ID, "model")

    print("\n" + "=" * 40)
    print("Setup complete. Now pull assets from Hugging Face:\n")
    print("  cd dataset && hf pull && cd ..")
    print("  cd models  && hf pull && cd ..")
    print("\nThen start the app:")
    print("  1. Train the model")
    print("  2. Start the backend")
    print("  3. Start the frontend")


if __name__ == "__main__":
    main()
