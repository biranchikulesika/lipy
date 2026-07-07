#!/usr/bin/env python3
"""Commit and push the nested dataset repo to Hugging Face."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from hf_git import commit_and_push, ensure_nested_repo  # noqa: E402


PROJECT_ROOT = Path(__file__).resolve().parents[2]


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
    commit_and_push(dataset_dir, args.message)


if __name__ == "__main__":
    main()
