# LiPy Backend

FastAPI inference service for LiPy OCR. The backend loads a trained Keras model and returns top OCR predictions for uploaded images.

## Runtime Contract

- The backend never trains.
- The backend does not own trained model artifacts in Git.
- The default model path is `../models/model.keras` when running from the full repo, or `./models/model.keras` in a backend-only deployment.
- Label metadata must live next to the model as `labels.json`.
- Cloud startup downloads the latest model from `https://huggingface.co/biranchikulesika/lipy`.
- To restore backend runtime artifacts locally, run `python backend/download_model.py` from the repository root.

## Endpoints

### `GET /health`

Returns:

```json
{ "status": "ok" }
```

### `POST /predict`

Request:

```http
Content-Type: multipart/form-data
image=<uploaded file>
```

Response:

```json
{
  "prediction": "CONS_KA",
  "confidence": 0.9452,
  "character": "କ",
  "top_predictions": [
    { "label": "CONS_KA", "confidence": 0.9452, "character": "କ" }
  ]
}
```

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins. | `*` |
| `LIPY_MODEL_PATH` | Optional absolute override for the model path. | `../models/model.keras` from full repo |
| `HF_MODEL_REPO_ID` | Hugging Face model repo used by deployment bootstrap scripts. | `biranchikulesika/lipy` |
| `HF_TOKEN` | Hugging Face token for private repos. | Optional |
| `PORT` | HTTP port. | Provider-defined, `8000` locally |

## Local Run

From the repository root:

```bash
pip install -r backend/requirements.txt
python backend/download_model.py
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

## Railway Deployment

Railway is configured with `/backend` as the service root. The backend folder contains every file needed to run there:

- `requirements.txt`
- `runtime.txt`
- `Procfile`
- `download_model.py`
- FastAPI app code

Railway runs:

```bash
python download_model.py && uvicorn main:app --host 0.0.0.0 --port $PORT
```

## Docker

Build from the `backend/` directory:

```bash
docker build -t lipy-backend .
docker run --rm -p 8000:8000 --env-file .env lipy-backend
```
