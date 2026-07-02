# LiPy Backend

The backend of LiPy is a robust, lightweight OCR inference API built with **FastAPI**. It serves the Keras-trained Convolutional Neural Network (CNN) to predict handwritten Odia characters.

## Technical Architecture

- **Framework**: FastAPI (Python 3)
- **Machine Learning**: TensorFlow / Keras for model inference
- **Image Processing**: OpenCV and Pillow (PIL)
- **Deployment**: Configured for Railway deployment via `Procfile` and `runtime.txt`

## How it Works

1. **Dynamic Model Auto-Discovery**: When the server boots up, `config.py` scans the `models/` directory for any `.keras` files. If there are multiple model files (e.g. from repeated training runs with timestamped names), it automatically sorts them by modification time and loads the newest one into memory. You do not need to update filenames in the code!
2. **Model Caching**: Upon startup, the backend pre-loads this discovered `.keras` model utilizing Python's `lru_cache`. This guarantees rapid inference without disk I/O on every request.
3. **Preprocessing Pipeline**: Uploaded images are passed through a strict preprocessing pipeline that mirrors the model's training:
   - EXIF orientation correction.
   - Grayscale conversion.
   - Area-interpolation resizing to exactly `64x64`.
   - Pixel normalization into the `[0, 1]` range.
3. **Inference**: The model returns raw probabilities across all Odia classes.
4. **Post-processing**: The top 3 (`TOP_K`) classes and their confidence scores are extracted using a statically defined label map (`labels.py`).

## API Endpoints

### `GET /health`
A simple health-check endpoint.
**Response**: `{"status": "ok"}`

### `POST /predict`
The primary inference endpoint.

**Request**:
```http
Content-Type: multipart/form-data
image=<uploaded file>
```

**Response Payload**:
```json
{
  "prediction": "CONS_KA",
  "confidence": 0.9452,
  "top_predictions": [
    { "label": "CONS_KA", "confidence": 0.9452 },
    { "label": "CONS_KHA", "confidence": 0.0311 },
    { "label": "CONS_GA", "confidence": 0.0101 }
  ]
}
```

## Environment Variables

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend domains. | `*` (All origins) |
| `LIPY_MODEL_PATH` | Absolute path overriding the location of the `.keras` model file. | `models/odia_ocr_cnn.keras` |

## Local Development

1. Ensure the virtual environment is active and dependencies are installed (`pip install -r requirements.txt`).
2. Run the server using Uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
3. Visit `http://localhost:8000/docs` to test the API directly using FastAPI's auto-generated Swagger UI.
