#!/usr/bin/env python3
"""Bootstrap nested local data/model working copies."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATASET_FOLDER = PROJECT_ROOT / "dataset" / "complete_dataset"
MODEL_PATH = PROJECT_ROOT / "models" / "model.keras"


def has_files(path: Path) -> bool:
    """Check if a directory exists and contains non-cache files."""
    if not path.exists():
        return False
    return any(item.name != ".cache" for item in path.iterdir())


def is_git_worktree(path: Path) -> bool:
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


def run_script(relative_path: str) -> None:
    """Run a Python script from the project root."""
    script_path = PROJECT_ROOT / relative_path
    if not script_path.is_file():
        print(f"Error: script not found: {script_path}", file=sys.stderr)
        sys.exit(1)
    result = subprocess.run(
        [sys.executable, str(script_path)],
        cwd=PROJECT_ROOT,
    )
    if result.returncode != 0:
        print(f"Error: {relative_path} failed (exit code {result.returncode})", file=sys.stderr)
        sys.exit(result.returncode)


def main() -> None:
    print("LiPy Project Setup")
    print("=" * 40)

    # ── Dataset ──
    dataset_root = PROJECT_ROOT / "dataset"
    if has_files(DEFAULT_DATASET_FOLDER) and is_git_worktree(dataset_root):
        print("[OK] Dataset already exists.")
    else:
        print("[..] Preparing dataset from Hugging Face...")
        run_script("scripts/dataset/download_hf.py")

    # ── Model ──
    model_root = PROJECT_ROOT / "models"
    if MODEL_PATH.is_file() and is_git_worktree(model_root):
        print("[OK] Model already exists.")
    else:
        print("[..] Preparing model from Hugging Face...")
        run_script("scripts/model/download_hf.py")

    print("\n" + "=" * 40)
    print("Setup complete.")
    print("\nNext steps:")
    print("  1. Train the model")
    print("  2. Start the backend")
    print("  3. Start the frontend")


if __name__ == "__main__":
    main()
