#!/usr/bin/env python3
"""Commit and push the nested model repo to Hugging Face."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from hf_git import commit_and_push, ensure_nested_repo  # noqa: E402


PROJECT_ROOT = Path(__file__).resolve().parents[2]
REQUIRED_FILES = ("model.keras", "labels.json")


def main() -> None:
    parser = argparse.ArgumentParser(description="Commit and push models/ to a Hugging Face Model repo.")
    parser.add_argument("--repo-id", default=os.getenv("HF_MODEL_REPO_ID", "biranchikulesika/lipy"), help="Hugging Face model repo id.")
    parser.add_argument("--model-dir", default=str(PROJECT_ROOT / "models"), help="Local model directory.")
    parser.add_argument("--message", default="Upload LiPy model artifacts", help="Hub commit message.")
    args = parser.parse_args()

    model_dir = Path(args.model_dir).resolve()
    ensure_nested_repo(model_dir, args.repo_id, "model")
    missing = [name for name in REQUIRED_FILES if not (model_dir / name).is_file()]
    if missing:
        print(f"Error: missing required model artifacts: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    commit_and_push(model_dir, args.message)


if __name__ == "__main__":
    main()
