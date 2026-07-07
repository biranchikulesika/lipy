#!/usr/bin/env python3
"""Clone or update the LiPy Hugging Face Dataset repo into dataset/."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from hf_git import ensure_nested_repo  # noqa: E402


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATASET_REPO_ID = "biranchikulesika/lipy"
def main() -> None:
    parser = argparse.ArgumentParser(description="Clone or update dataset/ from a Hugging Face Dataset repo.")
    parser.add_argument(
        "--repo-id",
        default=os.getenv("HF_DATASET_REPO_ID", DEFAULT_DATASET_REPO_ID),
        help="Hugging Face dataset repo id.",
    )
    parser.add_argument("--revision", default=os.getenv("HF_DATASET_REVISION"), help="Branch, tag, or commit to download.")
    parser.add_argument(
        "--output-dir",
        default=str(PROJECT_ROOT / "dataset"),
        help="Local nested Git working copy for the dataset repo.",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    ensure_nested_repo(output_dir, args.repo_id, "dataset", args.revision)
    print(f"Dataset repo ready at {output_dir}")


if __name__ == "__main__":
    main()
