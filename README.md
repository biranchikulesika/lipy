# Lipi

Lipi is an Odia handwritten character recognition project.

The project is split into independent deployable folders:

- `frontend/` runs on Vercel.
- `backend/` runs on Railway.
- `notebooks/` is for dataset exploration, training, and evaluation.

The hosted backend is selected from the `backend/` folder, so backend runtime code must not depend on files outside `backend/`.

## Structure

```text
lipi/
├── backend/
│   ├── models/
│   │   └── odia_ocr_cnn.keras
│   ├── config.py
│   ├── labels.py
│   ├── main.py
│   ├── model_loader.py
│   ├── predict.py
│   ├── preprocess.py
│   ├── requirements.txt
│   └── runtime.txt
├── data/
│   └── mini_dataset/
│       └── <CLASS_NAME>/
├── notebooks/
├── outputs/
│   ├── metrics/
│   ├── models/
│   └── training/
├── L.ipynb
├── README.md
└── requirements.txt
```

## Dataset

The notebooks follow the reference layout from `L.ipynb`:

```text
mini_dataset/
├── CONS_KA/
├── CONS_KHA/
├── VOW_A/
└── ...
```

In Colab, the default dataset path is:

```text
/content/drive/MyDrive/lipi/mini_dataset
```

Locally, the fallback path is:

```text
data/mini_dataset
```

## Training Artifacts

Training notebooks save model files using this convention:

```text
lipi_odia_ocr_<model_family>_<YYYYMMDD_HHMMSS>.keras
```

Local model artifacts are saved to:

```text
outputs/models/
```

When Google Drive is mounted in Colab, the same model is also saved to:

```text
/content/drive/MyDrive/lipi_models/
```

The backend does not automatically read from `outputs/` or Google Drive. After choosing a model, copy it into:

```text
backend/models/odia_ocr_cnn.keras
```

## Backend

Install and run from inside `backend/`:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

Railway should use `backend/` as the selected service folder.

Environment variables:

- `LIPI_MODEL_PATH`: optional model override inside the Railway service filesystem.
- `CORS_ORIGINS`: optional comma-separated list of allowed frontend origins.

## API

`GET /health`

`POST /predict`

Request:

```text
multipart/form-data
image=<uploaded image>
```

Response:

```json
{
  "prediction": "CONS_KA",
  "confidence": 0.94,
  "top_predictions": [
    { "label": "CONS_KA", "confidence": 0.94 },
    { "label": "CONS_KHA", "confidence": 0.03 },
    { "label": "CONS_GA", "confidence": 0.01 }
  ]
}
```
