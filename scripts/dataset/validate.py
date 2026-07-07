#!/usr/bin/env python3
"""Validate a local LiPy dataset folder."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}


def parse_jsonl(path: Path) -> int:
    rows = 0
    with open(path, "r", encoding="utf-8") as f:
        for line_number, line in enumerate(f, 1):
            if not line.strip():
                continue
            try:
                json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_number}: invalid JSONL row: {exc}") from exc
            rows += 1
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate a local flat image dataset folder.")
    parser.add_argument(
        "--dataset-dir",
        default=str(PROJECT_ROOT / "dataset" / "complete_dataset"),
        help="Local dataset folder to validate.",
    )
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    if not dataset_dir.is_dir():
        print(f"Error: dataset directory not found: {dataset_dir}", file=sys.stderr)
        sys.exit(1)

    split_counts = Counter()
    for split in ("train", "val", "test"):
        split_dir = dataset_dir / split
        if split_dir.is_dir():
            split_counts[split] = sum(1 for path in split_dir.rglob("*") if path.suffix.lower() in IMAGE_SUFFIXES)

    flat_images = sum(1 for path in dataset_dir.glob("*") if path.suffix.lower() in IMAGE_SUFFIXES)
    total_images = sum(split_counts.values()) or flat_images
    if total_images == 0:
        print(f"Error: no image files found in {dataset_dir}.", file=sys.stderr)
        sys.exit(1)

    metadata_path = dataset_dir / "metadata.json"
    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as f:
            json.load(f)

    jsonl_counts = {}
    for name in ("train.jsonl", "val.jsonl"):
        path = dataset_dir / name
        if path.exists():
            jsonl_counts[name] = parse_jsonl(path)

    print(f"Dataset OK: {total_images} image files.")
    if split_counts:
        print("Splits:", dict(split_counts))
    if jsonl_counts:
        print("JSONL rows:", jsonl_counts)


if __name__ == "__main__":
    main()
