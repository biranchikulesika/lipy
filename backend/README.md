# Lipi Backend

FastAPI OCR service for Railway deployment.

This folder is self-contained for runtime. Do not make backend imports depend on files from the repository root, `notebooks/`, `outputs/`, or `frontend/`.

## Run Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Railway

Select `backend/` as the Railway service folder.

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Model

Default model path:

```text
backend/models/odia_ocr_cnn.keras
```

Training notebooks save timestamped model artifacts outside the backend:

```text
outputs/models/lipi_odia_ocr_<model_family>_<YYYYMMDD_HHMMSS>.keras
```

Copy the chosen model into `backend/models/odia_ocr_cnn.keras` before deploying.
