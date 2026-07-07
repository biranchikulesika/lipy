# LiPy Backend

The LiPy backend is a FastAPI application responsible for running OCR inference on handwritten Odia characters.

It loads a trained TensorFlow model, preprocesses uploaded images, performs prediction, and returns the most likely character along with confidence scores.

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
├── Dockerfile
├── main.py               # FastAPI application
├── model_loader.py       # Loads model and labels
├── predict.py            # Prediction pipeline
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

Accepts a handwritten character image.

### Request

```http
Content-Type: multipart/form-data

image=<uploaded image>
```

### Response

```json
{
  "prediction": "CONS_KA",
  "confidence": 0.9452,
  "character": "କ",
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

Interactive API documentation is available at:

```text
/docs
```

---

# Configuration

The backend works without any environment variables for local development.

Optional configuration:

| Variable | Description | Default |
|-----------|-------------|---------|
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `*` |
| `HF_MODEL_REPO_ID` | Hugging Face model repository | `biranchikulesika/lipy` |
| `HF_TOKEN` | Hugging Face access token for private repositories | Optional |
| `LIPY_MODEL_PATH` | Override the default model location | `../models/model.keras` |
| `PORT` | HTTP server port | `8000` locally |

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

Build the image.

```bash
cd backend

docker build -t lipy-backend .
```

Run the container.

```bash
docker run --rm -p 8000:8000 lipy-backend
```

On startup the container downloads the latest model (if required) before launching the FastAPI server.

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