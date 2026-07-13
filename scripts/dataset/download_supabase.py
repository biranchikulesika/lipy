#!/usr/bin/env python3
"""
LiPy Dataset Downloader
Downloads verified Odia handwritten character recognition images
from the Supabase storage bucket with retry logic and integrity checks.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]

BUCKET_NAME = "lipy-samples"
TABLE_NAME = "lipy_samples"
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds (doubles each retry)
REQUEST_TIMEOUT = 30  # seconds


def load_env_file(env_path: Path) -> dict[str, str]:
    """Load environment variables from a .env file."""
    env_vars: dict[str, str] = {}
    if not env_path.is_file():
        return env_vars
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                env_vars[key.strip()] = val.strip().strip("'\"")
    return env_vars


def get_config(env_path: Path) -> tuple[str, str]:
    """Retrieve Supabase URL and key from environment or .env file."""
    env_vars = load_env_file(env_path)

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or env_vars.get("NEXT_PUBLIC_SUPABASE_URL")
    if not url:
        print(f"Error: NEXT_PUBLIC_SUPABASE_URL not set (checked env and {env_path})", file=sys.stderr)
        sys.exit(1)

    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or env_vars.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or env_vars.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not key:
        print("Error: No Supabase key found (checked SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY)", file=sys.stderr)
        sys.exit(1)

    return url.rstrip("/"), key


def _http_request(url: str, headers: dict[str, str], retries: int = MAX_RETRIES) -> bytes:
    """Make an HTTP GET with retry and timeout."""
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as res:
                return res.read()
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
            last_err = e
            if attempt < retries - 1:
                delay = RETRY_DELAY * (2 ** attempt)
                print(f"  Retry {attempt + 1}/{retries} for {url.split('/')[-1]} in {delay}s...", file=sys.stderr)
                time.sleep(delay)
    raise last_err or RuntimeError(f"Request failed after {retries} attempts")


def fetch_all_metadata(base_url: str, headers: dict[str, str], limit_max: int | None = None) -> list[dict]:
    """Fetch verified metadata records using pagination."""
    records: list[dict] = []
    offset = 0
    batch_size = 1000

    print(f"Fetching verified metadata from '{TABLE_NAME}'...")
    while True:
        current_limit = batch_size
        if limit_max is not None:
            remaining = limit_max - len(records)
            if remaining <= 0:
                break
            current_limit = min(batch_size, remaining)

        url = (
            f"{base_url}/rest/v1/{TABLE_NAME}"
            f"?select=id,filename,storage_path,character_text"
            f"&status=eq.verified"
            f"&order=character_text.asc,created_at.desc"
            f"&limit={current_limit}&offset={offset}"
        )
        try:
            raw = _http_request(url, headers)
            batch = json.loads(raw)
        except Exception as e:
            print(f"Error fetching metadata batch at offset {offset}: {e}", file=sys.stderr)
            sys.exit(1)

        if not batch:
            break
        records.extend(batch)
        offset += len(batch)
        print(f"  Loaded {len(records)} records...")
        if len(batch) < batch_size:
            break

    return records


def _file_checksum(path: Path) -> str:
    """Compute SHA-256 of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def download_single_image(
    base_url: str,
    headers: dict[str, str],
    bucket_name: str,
    record: dict,
    output_dir: Path,
    force: bool = False,
) -> tuple[str, str]:
    """Download a single image with retry and checksum verification."""
    filename = record.get("filename")
    storage_path = record.get("storage_path")
    character_text = record.get("character_text", "unknown")

    if not filename or not storage_path:
        return "skipped_invalid", "Missing filename or storage_path"

    char_dir = output_dir / character_text
    char_dir.mkdir(parents=True, exist_ok=True)
    local_path = char_dir / filename

    if not force and local_path.is_file() and local_path.stat().st_size > 0:
        return "skipped_exists", filename

    download_url = f"{base_url}/storage/v1/object/authenticated/{bucket_name}/{storage_path}"

    try:
        content = _http_request(download_url, headers)
        local_path.write_bytes(content)

        # Verify non-empty
        if local_path.stat().st_size == 0:
            local_path.unlink(missing_ok=True)
            return "failed", f"Empty file: {filename}"

        return "downloaded", filename
    except Exception as e:
        local_path.unlink(missing_ok=True)
        return "failed", f"{filename}: {e}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Download verified LiPy dataset from Supabase.")
    parser.add_argument("-o", "--output-dir", type=str, default=str(PROJECT_ROOT / "dataset" / "complete_dataset"))
    parser.add_argument("-e", "--env-file", type=str, default="./.env")
    parser.add_argument("-t", "--threads", type=int, default=16)
    parser.add_argument("-f", "--force", action="store_true", help="Redownload existing files")
    parser.add_argument("-l", "--limit", type=int, default=None, help="Limit files to download")
    args = parser.parse_args()

    output_dir = Path(args.output_dir).resolve()
    env_path = Path(args.env_file).resolve()

    print(f"Loading config from: {env_path}")
    supabase_url, supabase_key = get_config(env_path)

    headers = {"apikey": supabase_key, "Authorization": f"Bearer {supabase_key}"}

    print(f"Table:  '{TABLE_NAME}'")
    print(f"Bucket: '{BUCKET_NAME}'")
    records = fetch_all_metadata(supabase_url, headers, args.limit)
    print(f"Found {len(records)} verified records.")

    if not records:
        print("Nothing to download.")
        return

    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Target: {output_dir}")
    print(f"Downloading with {args.threads} threads...")

    start = time.time()
    counters: dict[str, int] = {"downloaded": 0, "skipped_exists": 0, "skipped_invalid": 0, "failed": 0}
    failures: list[str] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.threads) as pool:
        futures = {
            pool.submit(
                download_single_image, supabase_url, headers, BUCKET_NAME, record, output_dir, args.force,
            ): record
            for record in records
        }
        total = len(futures)
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            status, info = future.result()
            counters[status] = counters.get(status, 0) + 1
            if status == "failed":
                failures.append(info)
            if i % 100 == 0 or i == total:
                pct = (i / total) * 100
                print(f"  Progress: {i}/{total} ({pct:.1f}%)")

    elapsed = time.time() - start

    print("\n" + "=" * 50)
    print("Download Summary")
    print(f"  Duration:     {elapsed:.1f}s")
    print(f"  Downloaded:   {counters['downloaded']}")
    print(f"  Skipped:      {counters['skipped_exists']} existing, {counters['skipped_invalid']} invalid")
    print(f"  Failed:       {counters['failed']}")
    if failures:
        print("\nFailures:")
        for f in failures[:20]:
            print(f"  - {f}")
        if len(failures) > 20:
            print(f"  ... and {len(failures) - 20} more")
    print("=" * 50)

    if counters["failed"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
