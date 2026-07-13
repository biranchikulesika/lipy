#!/usr/bin/env python3
"""Validate a local LiPy dataset for integrity and completeness."""

from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}

MIN_IMAGE_SIZE_BYTES = 100  # Suspiciously small files


def parse_jsonl(path: Path) -> tuple[int, list[str]]:
    """Validate a JSONL file. Returns (row_count, errors)."""
    rows = 0
    errors: list[str] = []
    with open(path, "r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            stripped = line.strip()
            if not stripped:
                continue
            try:
                json.loads(stripped)
                rows += 1
            except json.JSONDecodeError as e:
                errors.append(f"  Line {line_no}: {e.msg}")
    return rows, errors


def count_images(directory: Path) -> tuple[int, list[str]]:
    """Count images recursively. Returns (count, warnings for suspicious files)."""
    count = 0
    warnings: list[str] = []
    for path in directory.rglob("*"):
        if path.suffix.lower() in IMAGE_SUFFIXES:
            count += 1
            if path.stat().st_size < MIN_IMAGE_SIZE_BYTES:
                warnings.append(f"  {path.name}: {path.stat().st_size} bytes (suspiciously small)")
    return count, warnings


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate a local LiPy dataset.")
    parser.add_argument(
        "--dataset-dir",
        default=str(PROJECT_ROOT / "dataset" / "complete_dataset"),
        help="Dataset directory.",
    )
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir).resolve()
    errors: list[str] = []
    warnings: list[str] = []

    # ── Existence check ──
    if not dataset_dir.exists():
        print(f"Error: Dataset not found: {dataset_dir}", file=sys.stderr)
        sys.exit(1)
    if not dataset_dir.is_dir():
        print(f"Error: Not a directory: {dataset_dir}", file=sys.stderr)
        sys.exit(1)

    # ── Image counts ──
    split_counts: Counter = Counter()
    split_warnings: dict[str, list[str]] = {}

    for split in ("train", "val", "test"):
        split_dir = dataset_dir / split
        if split_dir.is_dir():
            count, warns = count_images(split_dir)
            split_counts[split] = count
            if warns:
                split_warnings[split] = warns

    flat_count, flat_warns = 0, []
    for path in dataset_dir.glob("*"):
        if path.suffix.lower() in IMAGE_SUFFIXES:
            flat_count += 1
            if path.stat().st_size < MIN_IMAGE_SIZE_BYTES:
                flat_warns.append(f"  {path.name}: {path.stat().st_size} bytes (suspiciously small)")

    total_images = sum(split_counts.values()) or flat_count
    if total_images == 0:
        print(f"Error: No image files found in {dataset_dir}", file=sys.stderr)
        sys.exit(1)

    # ── metadata.json ──
    metadata_ok = False
    metadata_path = dataset_dir / "metadata.json"
    if metadata_path.exists():
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                json.load(f)
            metadata_ok = True
        except (json.JSONDecodeError, ValueError) as e:
            errors.append(f"  metadata.json: {e}")

    # ── JSONL files ──
    jsonl_results: dict[str, tuple[int, list[str]]] = {}
    for filename in ("train.jsonl", "val.jsonl"):
        path = dataset_dir / filename
        if path.exists():
            jsonl_results[filename] = parse_jsonl(path)

    # ── Unique filenames check ──
    filenames: list[str] = []
    for path in dataset_dir.rglob("*"):
        if path.suffix.lower() in IMAGE_SUFFIXES:
            filenames.append(path.name)
    if len(filenames) != len(set(filenames)):
        dupes = len(filenames) - len(set(filenames))
        warnings.append(f"  {dupes} duplicate filename(s) found across splits")

    # ── Output ──
    print("=" * 60)
    print("LiPy Dataset Validation")
    print("=" * 60)
    print(f"Dataset  : {dataset_dir.name}")
    print(f"Location : {dataset_dir}")
    print(f"Images   : {total_images:,}")

    if split_counts:
        print("\nSplits")
        for split in ("train", "val", "test"):
            if split in split_counts:
                print(f"  {split:<5}: {split_counts[split]:,}")

    if metadata_ok:
        print("\nMetadata: metadata.json OK")
    elif metadata_path.exists():
        print("\nMetadata: metadata.json INVALID")

    if jsonl_results:
        print("\nJSONL")
        for filename, (rows, errs) in jsonl_results.items():
            status = f"{rows:,} rows" if not errs else f"{rows:,} rows ({len(errs)} errors)"
            print(f"  {filename:<12}: {status}")
            for e in errs[:5]:
                print(e)

    if warnings or flat_warns or any(split_warnings.values()):
        print("\nWarnings")
        for w in warnings:
            print(w)
        for w in flat_warns:
            print(w)
        for ws in split_warnings.values():
            for w in ws:
                print(w)

    if errors:
        print("\nErrors")
        for e in errors:
            print(e)
        print("\n  X Dataset validation FAILED.")
        print("=" * 60)
        sys.exit(1)

    print("\n  OK Dataset validation passed.")
    print("=" * 60)


if __name__ == "__main__":
    main()
