#!/usr/bin/env python3
"""
LiPy Dataset Downloader
This script downloads the entire Odia handwritten character recognition dataset
from the Supabase database/storage bucket.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path


def load_env_file(env_path: Path) -> dict[str, str]:
    """Loads environment variables from a .env file."""
    env_vars = {}
    if not env_path.is_file():
        return env_vars
    
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, val = line.split("=", 1)
                # Strip surrounding quotes if present
                val = val.strip().strip("'\"")
                env_vars[key.strip()] = val
    return env_vars


def get_config(env_path: Path) -> tuple[str, str]:
    """Retrieves Supabase URL and Key from environment or .env file."""
    # 1. Load from .env file
    env_vars = load_env_file(env_path)
    
    # 2. Get Supabase URL
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or env_vars.get("NEXT_PUBLIC_SUPABASE_URL")
    if not url:
        print(f"Error: NEXT_PUBLIC_SUPABASE_URL is not set in environment or in {env_path}", file=sys.stderr)
        sys.exit(1)
        
    # 3. Get Supabase Key (prefer SERVICE_ROLE_KEY to bypass RLS, fallback to ANON_KEY)
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or env_vars.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        or env_vars.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not key:
        print(f"Error: Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set", file=sys.stderr)
        sys.exit(1)
        
    return url.rstrip("/"), key


def detect_table_and_bucket(base_url: str, headers: dict[str, str]) -> tuple[str, str]:
    """Detects active table name and bucket name in Supabase."""
    # Table detection
    detected_table = None
    for name in ["lipi_samples", "lipy_samples"]:
        test_url = f"{base_url}/rest/v1/{name}?select=id&limit=1"
        try:
            req = urllib.request.Request(test_url, headers=headers)
            with urllib.request.urlopen(req) as res:
                detected_table = name
                break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            print(f"Warning: HTTP error checking table '{name}': {e.code} {e.reason}", file=sys.stderr)
    
    if not detected_table:
        print("Error: Could not find table 'lipi_samples' or 'lipy_samples' in the database.", file=sys.stderr)
        sys.exit(1)
        
    # Bucket detection
    detected_bucket = None
    buckets_url = f"{base_url}/storage/v1/bucket"
    try:
        req = urllib.request.Request(buckets_url, headers=headers)
        with urllib.request.urlopen(req) as res:
            buckets = json.loads(res.read().decode())
            bucket_ids = [b.get("id") for b in buckets if b.get("id")]
            for b_id in ["lipi-samples", "lipy-samples"]:
                if b_id in bucket_ids:
                    detected_bucket = b_id
                    break
            if not detected_bucket and bucket_ids:
                detected_bucket = bucket_ids[0]
    except Exception as e:
        print(f"Warning: Could not list buckets ({e}). Defaulting to 'lipi-samples'.", file=sys.stderr)
        detected_bucket = "lipi-samples"
        
    return detected_table, detected_bucket


def fetch_all_metadata(base_url: str, headers: dict[str, str], table_name: str, limit_max: int | None = None) -> list[dict]:
    """Fetches all metadata records from the specified table using pagination."""
    records = []
    offset = 0
    batch_size = 1000
    
    print(f"Fetching metadata from table '{table_name}'...")
    while True:
        # Request batch size
        current_limit = batch_size
        if limit_max is not None:
            remaining = limit_max - len(records)
            if remaining <= 0:
                break
            current_limit = min(batch_size, remaining)
            
        url = f"{base_url}/rest/v1/{table_name}?select=id,filename,storage_path&order=id.asc&limit={current_limit}&offset={offset}"
        req = urllib.request.Request(url, headers=headers)
        
        try:
            with urllib.request.urlopen(req) as res:
                batch = json.loads(res.read().decode())
                if not batch:
                    break
                records.extend(batch)
                offset += len(batch)
                print(f"  Loaded {len(records)} metadata records...")
                if len(batch) < batch_size:
                    break
        except Exception as e:
            print(f"Error fetching metadata batch: {e}", file=sys.stderr)
            sys.exit(1)
            
    return records


def download_single_image(
    base_url: str,
    headers: dict[str, str],
    bucket_name: str,
    record: dict,
    output_dir: Path,
    force: bool = False
) -> tuple[str, str]:
    """Downloads a single image from Supabase Storage and saves it locally."""
    filename = record.get("filename")
    storage_path = record.get("storage_path")
    
    if not filename or not storage_path:
        return "skipped_invalid", "Missing filename or storage_path"
        
    local_path = output_dir / filename
    
    # Check if file exists and matches size
    if not force and local_path.is_file() and local_path.stat().st_size > 0:
        return "skipped_exists", filename

    # Build authenticated object URL
    download_url = f"{base_url}/storage/v1/object/authenticated/{bucket_name}/{storage_path}"
    req = urllib.request.Request(download_url, headers=headers)
    
    try:
        with urllib.request.urlopen(req) as res:
            content = res.read()
            local_path.write_bytes(content)
            return "downloaded", filename
    except urllib.error.HTTPError as e:
        return "failed", f"HTTP {e.code} for {filename}: {e.read().decode()}"
    except Exception as e:
        return "failed", f"Error for {filename}: {str(e)}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Download the entire LiPy handwriting OCR dataset.")
    parser.add_argument(
        "-o", "--output-dir",
        type=str,
        default="./data/dataset/complete_dataset",
        help="Directory to save downloaded dataset files (default: ./data/dataset/complete_dataset)"
    )
    parser.add_argument(
        "-e", "--env-file",
        type=str,
        default="./frontend/.env",
        help="Path to Next.js env configuration file (default: ./frontend/.env)"
    )
    parser.add_argument(
        "-t", "--threads",
        type=int,
        default=16,
        help="Number of concurrent download threads (default: 16)"
    )
    parser.add_argument(
        "-f", "--force",
        action="store_true",
        help="Force redownload of existing files"
    )
    parser.add_argument(
        "-l", "--limit",
        type=int,
        default=None,
        help="Limit number of files to download (for testing)"
    )
    
    args = parser.parse_args()
    
    output_dir = Path(args.output_dir).resolve()
    env_path = Path(args.env_file).resolve()
    
    # 1. Resolve credentials
    print(f"Resolving configuration from: {env_path}")
    supabase_url, supabase_key = get_config(env_path)
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}"
    }
    
    # 2. Detect active schema tables/buckets
    print("Connecting to Supabase...")
    table_name, bucket_name = detect_table_and_bucket(supabase_url, headers)
    print(f"  Using table:  '{table_name}'")
    print(f"  Using bucket: '{bucket_name}'")
    
    # 3. Retrieve metadata
    records = fetch_all_metadata(supabase_url, headers, table_name, args.limit)
    total_records = len(records)
    print(f"Found {total_records} matching records in database.")
    
    if total_records == 0:
        print("No dataset files found to download.")
        return
        
    # Ensure output directory exists
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Target directory: {output_dir}")
    
    # 4. Download files concurrently
    print(f"Starting concurrent download using {args.threads} threads...")
    start_time = time.time()
    
    counters = {"downloaded": 0, "skipped_exists": 0, "skipped_invalid": 0, "failed": 0}
    failures = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = {
            executor.submit(
                download_single_image,
                supabase_url,
                headers,
                bucket_name,
                record,
                output_dir,
                args.force
            ): record
            for record in records
        }
        
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            status, info = future.result()
            counters[status] = counters.get(status, 0) + 1
            if status == "failed":
                failures.append(info)
                
            # Log progress
            if i % 100 == 0 or i == total_records:
                pct = (i / total_records) * 100
                print(f"  Progress: {i}/{total_records} files processed ({pct:.1f}%)...")
                
    elapsed = time.time() - start_time
    
    # 5. Summarize execution
    print("\n" + "=" * 50)
    print("Download Summary:")
    print(f"  Total Duration:     {elapsed:.2f} seconds")
    print(f"  Downloaded:         {counters['downloaded']} files")
    print(f"  Skipped (Existing): {counters['skipped_exists']} files")
    print(f"  Skipped (Invalid):  {counters['skipped_invalid']} files")
    print(f"  Failed:             {counters['failed']} files")
    
    if failures:
        print("\nFailures:")
        for fail in failures[:10]:
            print(f"  - {fail}")
        if len(failures) > 10:
            print(f"  - ... and {len(failures) - 10} more errors.")
            
    print("=" * 50)


if __name__ == "__main__":
    main()
