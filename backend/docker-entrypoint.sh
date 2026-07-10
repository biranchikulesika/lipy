#!/bin/sh

set -eu

echo "Checking model..."

python download_model.py

echo "Starting LiPy backend..."

exec uvicorn main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}"