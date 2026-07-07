#!/usr/bin/env python3
"""Validate a local LiPy dataset."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

IMAGE_SUFFIXES = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
}


def parse_jsonl(path: Path) -> int:
    """Validate a JSONL file and return the number of rows."""
    rows = 0

    with open(path, "r", encoding="utf-8") as file:
        for line_number, line in enumerate(file, start=1):
            if not line.strip():
                continue

            try:
                json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(
                    f"{path}:{line_number}: invalid JSON object."
                ) from exc

            rows += 1

    return rows


def count_images(directory: Path) -> int:
    """Count supported image files recursively."""
    return sum(
        1
        for path in directory.rglob("*")
        if path.suffix.lower() in IMAGE_SUFFIXES
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate a local LiPy dataset."
    )

    parser.add_argument(
        "--dataset-dir",
        default=str(PROJECT_ROOT / "dataset" / "complete_dataset"),
        help="Dataset directory.",
    )

    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()

    if not dataset_dir.exists():
        print(f"Error: Dataset not found:\n{dataset_dir}", file=sys.stderr)
        sys.exit(1)

    if not dataset_dir.is_dir():
        print(f"Error: Not a directory:\n{dataset_dir}", file=sys.stderr)
        sys.exit(1)

    split_counts = Counter()

    for split in ("train", "val", "test"):
        split_dir = dataset_dir / split

        if split_dir.is_dir():
            split_counts[split] = count_images(split_dir)

    flat_images = sum(
        1
        for path in dataset_dir.glob("*")
        if path.suffix.lower() in IMAGE_SUFFIXES
    )

    total_images = sum(split_counts.values()) or flat_images

    if total_images == 0:
        print(
            f"Error: No image files found in\n{dataset_dir}",
            file=sys.stderr,
        )
        sys.exit(1)

    metadata_ok = False
    metadata_path = dataset_dir / "metadata.json"

    if metadata_path.exists():
        with open(metadata_path, "r", encoding="utf-8") as file:
            json.load(file)

        metadata_ok = True

    jsonl_counts = {}

    for filename in ("train.jsonl", "val.jsonl"):
        path = dataset_dir / filename

        if path.exists():
            jsonl_counts[filename] = parse_jsonl(path)

    print("=" * 60)
    print("LiPy Dataset Validation")
    print("=" * 60)

    print(f"Dataset        : {dataset_dir.name}")
    print(f"Location       : {dataset_dir}")
    print(f"Images         : {total_images:,}")

    if split_counts:
        print("\nDataset Splits")

        for split in ("train", "val", "test"):
            if split in split_counts:
                print(f"  {split:<5}: {split_counts[split]:,}")

    if metadata_ok:
        print("\nMetadata")
        print("  metadata.json : OK")

    if jsonl_counts:
        print("\nJSONL Files")

        for filename, rows in jsonl_counts.items():
            print(f"  {filename:<12}: {rows:,} rows")

    print("\nStatus")
    print("  ✓ Dataset validation passed.")

    print("=" * 60)


if __name__ == "__main__":
    main()