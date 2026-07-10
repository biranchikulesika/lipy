# LiPy Backend

The LiPy backend is a FastAPI application responsible for running OCR inference on handwritten Odia characters.

It loads a trained TensorFlow model, preprocesses uploaded images, performs prediction, and returns the most likely character along with confidence scores and a prediction status.

The backend **never trains models**. It only serves trained model artifacts.

---

# Architecture

The backend expects the following runtime artifacts:

```text
models/
├── model.keras
└── labels.json
```

These files are downloaded from the LiPy Hugging Face Model repository during deployment or can be restored locally using `download_model.py`.

```
Client
   │
   ▼
FastAPI
   │
   ▼
Image Preprocessing
   │
   ▼
TensorFlow Model
   │
   ▼
Confidence Evaluation
   │
   ▼
Top Predictions
   │
   ▼
JSON Response
```

---

# Project Structure

```text
backend/
│
├── __init__.py
├── config.py             # Shared backend configuration
├── download_model.py     # Downloads model artifacts from Hugging Face
├── docker-entrypoint.sh  # Container startup script
├── Dockerfile
├── main.py               # FastAPI application (routes & Pydantic models)
├── model_loader.py       # Loads model and labels
├── predict.py            # Prediction pipeline & confidence evaluation
├── preprocess.py         # Image preprocessing
├── README.md
└── requirements.txt
```

---

# API Endpoints

## `GET /`

Returns a welcome message.

```json
{
  "message": "Welcome to the LiPy OCR API! Visit /docs for interactive documentation."
}
```

---

## `GET /health`

Health check endpoint.

```json
{
  "status": "ok"
}
```

---

## `POST /predict`

Accepts a handwritten character image and returns the recognition result with a prediction status.

### Request

```http
Content-Type: multipart/form-data

image=<uploaded image>
```

### Response Model

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Prediction quality: `"success"`, `"low_confidence"`, or `"ambiguous"` |
| `prediction` | `string \| null` | Predicted class label (e.g. `"CONS_KA"`). `null` when status is not `success` |
| `confidence` | `float` | Confidence score of the top prediction (0.0 – 1.0) |
> **Note:** The endpoint uses `response_model_exclude_none=True`, so nullable fields are **omitted from the JSON response** when `null` rather than sent as explicit `null`. The examples below show `null` for clarity.

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | Prediction quality: `"success"`, `"low_confidence"`, or `"ambiguous"` |
| `prediction` | `string \| null` | Predicted class label (e.g. `"CONS_KA"`). Omitted when status is not `success` |
| `confidence` | `float` | Confidence score of the top prediction (0.0 – 1.0) |
| `character` | `string \| null` | Odia Unicode character (e.g. `"କ"`). Omitted when not in the label map or status is not `success` |
| `reason` | `string \| null` | Explanation of non-successful status. Omitted on `success` |
| `top_predictions` | `array` | Top-K predictions sorted by confidence descending |

Each item in `top_predictions`:

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Class label |
| `confidence` | `float` | Confidence score |
| `character` | `string` | Odia Unicode character or empty string if not found |

### Statuses

| Status | Condition | `prediction` | `reason` |
|--------|-----------|--------------|----------|
| `success` | Top confidence ≥ `LOW_CONFIDENCE_THRESHOLD` (0.60) **and** margin ≥ `AMBIGUOUS_MARGIN` (0.10) | Set | `null` |
| `low_confidence` | Top confidence < 0.60 | `null` | `"confidence_below_threshold"` |
| `ambiguous` | Top confidence ≥ 0.60 **but** margin between top-2 < 0.10 | `null` | `"top_predictions_too_close"` |

### Example: Successful Prediction

```json
{
  "status": "success",
  "prediction": "CONS_KA",
  "confidence": 0.9452,
  "character": "କ",
  "reason": null,
  "top_predictions": [
    {
      "label": "CONS_KA",
      "confidence": 0.9452,
      "character": "କ"
    },
    {
      "label": "CONS_KHA",
      "confidence": 0.0318,
      "character": "ଖ"
    },
    {
      "label": "CONS_GA",
      "confidence": 0.0124,
      "character": "ଗ"
    }
  ]
}
```

### Example: Low Confidence

```json
{
  "status": "low_confidence",
  "prediction": null,
  "confidence": 0.1873,
  "character": null,
  "reason": "confidence_below_threshold",
  "top_predictions": [
    {
      "label": "CONS_LLA",
      "confidence": 0.1873,
      "character": ""
    },
    {
      "label": "CONS_YA",
      "confidence": 0.1591,
      "character": ""
    },
    {
      "label": "CONS_NYA",
      "confidence": 0.1285,
      "character": ""
    }
  ]
}
```

### Example: Ambiguous

```json
{
  "status": "ambiguous",
  "prediction": null,
  "confidence": 0.65,
  "character": null,
  "reason": "top_predictions_too_close",
  "top_predictions": [
    {
      "label": "CONS_KA",
      "confidence": 0.65,
      "character": "କ"
    },
    {
      "label": "CONS_KHA",
      "confidence": 0.58,
      "character": "ଖ"
    },
    {
      "label": "CONS_GA",
      "confidence": 0.04,
      "character": "ଗ"
    }
  ]
}
```

Interactive API documentation is available at:

```text
/docs
```

---

# Prediction Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `TOP_K` | `3` | Number of top predictions returned |
| `LOW_CONFIDENCE_THRESHOLD` | `0.60` | Minimum confidence for a `success` status |
| `AMBIGUOUS_MARGIN` | `0.10` | Minimum margin between top-2 predictions for a `success` status |
| `IMAGE_SIZE` | `64` | Input image size (pixels) |

---

# Configuration

The backend works without any environment variables for local development.

Optional configuration:

| Variable | Description | Default |
|-----------|-------------|---------|
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `*` |
| `HF_MODEL_REPO_ID` | Hugging Face model repository | `biranchikulesika/lipy` |
| `HF_MODEL_REVISION` | Hugging Face model branch/commit | Latest |
| `HF_TOKEN` | Hugging Face access token for private repositories | Optional |
| `LIPY_MODEL_PATH` | Override the default model location | `../models/model.keras` |
| `PORT` | HTTP server port | `8000` |

---

# Local Development

Install dependencies.

```bash
pip install -r backend/requirements.txt
```

Download the latest model.

```bash
python backend/download_model.py
```

Start the API.

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

```text
http://localhost:8000/docs
```

---

# Docker

## Building the Image

```bash
cd backend

docker build -t lipy-backend .
```

## Running the Container

The container automatically downloads the model from Hugging Face on startup via the entrypoint script.

```bash
docker run --rm -p 8000:8000 lipy-backend
```

### Mounting a Local Model

To use a pre-downloaded model (avoid re-downloading on every startup or work offline), mount the model directory:

```bash
docker run --rm -p 8000:8000 \
  -v /path/to/models:/app/models \
  lipy-backend
```

> **Note:** On SELinux-enforcing systems, you may need to add `:Z` to the volume mount:
> `-v /path/to/models:/app/models:Z`

### Passing Environment Variables

```bash
docker run --rm -p 8000:8000 \
  -e CORS_ORIGINS="https://example.com" \
  -e HF_MODEL_REPO_ID="your-org/your-model" \
  -e HF_TOKEN="hf_xxx" \
  lipy-backend
```

## How the Entrypoint Works

On container startup, `docker-entrypoint.sh` runs:

1. Executes `python download_model.py` — checks Hugging Face for the latest model revision and downloads it if needed.
2. Starts `uvicorn main:app` on the configured `PORT`.

---

# Railway Deployment

Railway deploys the `backend/` directory as an independent service.

Startup command:

```bash
python download_model.py && uvicorn main:app --host 0.0.0.0 --port $PORT
```

During deployment the backend:

1. Downloads the latest `model.keras` and `labels.json` from Hugging Face.
2. Loads the model into memory.
3. Starts the FastAPI server.
4. Serves prediction requests.

---

# Related Documentation

- **Root README** – Project overview and architecture
- **Frontend README** – Web application
- **Scripts README** – Dataset and model management
- **Notebook (`L.ipynb`)** – Model training workflow