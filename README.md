# Lipi

Lipi is an Odia handwritten character recognition project. It includes dataset exploration, model training, evaluation, and a deployable OCR API.

This README is the main reference for the project structure, workflow, and usage.

## Quick Summary

- `frontend/` is deployed independently on Vercel.
- `backend/` is deployed independently on Railway.
- `notebooks/` contains the machine learning workflow.
- Notebooks are edited and run from VS Code.
- We connect VS Code notebook cells to a Google Colab ipykernel using the VS Code Google Colab extension.
- Google Drive stores the dataset and trained model artifacts.
- The backend can only depend on files inside `backend/` at runtime.

## Project Structure

```text
lipi/
|-- backend/
|   |-- models/
|   |   `-- odia_ocr_cnn.keras
|   |-- config.py
|   |-- labels.py
|   |-- main.py
|   |-- model_loader.py
|   |-- predict.py
|   |-- preprocess.py
|   |-- requirements.txt
|   `-- runtime.txt
|-- data/
|   `-- mini_dataset/
|       `-- <CLASS_NAME>/
|-- notebooks/
|   |-- 01_dataset_exploration.ipynb
|   |-- 02_preprocessing.ipynb
|   |-- 03_first_cnn.ipynb
|   |-- 04_full_training.ipynb
|   `-- 05_evaluation.ipynb
|-- outputs/
|   |-- metrics/
|   |-- models/
|   `-- training/
|-- frontend/
|-- L.ipynb
|-- README.md
|-- project_plan.md
`-- requirements.txt
```

## Deployment Boundary

The project is split into separate hosted services:

| Folder | Purpose | Hosting |
| --- | --- | --- |
| `frontend/` | Web UI | Vercel |
| `backend/` | FastAPI OCR API | Railway |
| `notebooks/` | ML training/evaluation | VS Code + Colab ipykernel |

Important:

- Railway is configured with `backend/` as the selected folder.
- Backend runtime code must not read or import files outside `backend/`.
- Vercel is configured with `frontend/` as the selected folder.
- Frontend runtime code must not depend on backend/root notebook files.

## Notebook Workflow

We do not use the Google Colab website as the primary editing environment anymore.

Instead:

1. Open the repository in VS Code.
2. Open a notebook from `notebooks/`.
3. Use the VS Code Google Colab extension to connect the notebook to a Colab ipykernel.
4. Run the notebook cells in VS Code.
5. Colab provides compute and Google Drive access.
6. VS Code remains the place where notebook files are edited, saved, committed, and reviewed.

This keeps the team workflow consistent while still using Colab compute.

## Dataset

The notebooks follow the reference structure from `L.ipynb`:

```text
mini_dataset/
|-- CONS_KA/
|-- CONS_KHA/
|-- CONS_GA/
|-- VOW_A/
`-- ...
```

Each folder is one class. Each file inside the folder is one handwritten image for that class.

Default Google Drive dataset path:

```text
/content/drive/MyDrive/lipi/mini_dataset
```

Local fallback path:

```text
data/mini_dataset
```

Notebook preprocessing follows the reference notebook:

- Keep class folders with at least `MIN_IMAGES = 25`
- Sort valid class names
- Create `label_map = {class_name: integer_id}`
- Load images with OpenCV in grayscale
- Resize to `64 x 64`
- Normalize pixels to `0..1`
- Reshape to `(samples, 64, 64, 1)`
- One-hot encode labels for multi-class classification

## Model Artifacts

Training notebooks save models with this naming convention:

```text
lipi_odia_ocr_<model_family>_<YYYYMMDD_HHMMSS>.keras
```

Examples:

```text
lipi_odia_ocr_baseline_cnn_20260615_153000.keras
lipi_odia_ocr_full_cnn_best_20260615_161500.keras
```

Local model output:

```text
outputs/models/
```

Google Drive model output:

```text
/content/drive/MyDrive/lipi_models/
```

The backend does not automatically use models from `outputs/` or Google Drive. After choosing the best model, copy it to:

```text
backend/models/odia_ocr_cnn.keras
```

That exact filename is the default model used by the Railway backend.

## Notebook Guide

| Notebook | Purpose |
| --- | --- |
| `L.ipynb` | Reference notebook for data layout, labels, and original preprocessing |
| `notebooks/01_dataset_exploration.ipynb` | Check dataset path, class folders, image counts, sample images |
| `notebooks/02_preprocessing.ipynb` | Verify grayscale, resize, normalization, and tensor shapes |
| `notebooks/03_first_cnn.ipynb` | Train a simple baseline CNN |
| `notebooks/04_full_training.ipynb` | Train stronger model with augmentation, class weighting, checkpoints, metrics |
| `notebooks/05_evaluation.ipynb` | Load a saved model, generate metrics and confusion matrix |

Recommended order:

1. `01_dataset_exploration.ipynb`
2. `02_preprocessing.ipynb`
3. `03_first_cnn.ipynb`
4. `04_full_training.ipynb`
5. `05_evaluation.ipynb`

## Backend

The backend is a FastAPI service for OCR prediction.

Run locally:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```text
GET /health
```

Prediction endpoint:

```text
POST /predict
```

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

Railway settings:

```text
Service folder: backend/
Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Backend environment variables:

| Variable | Use |
| --- | --- |
| `LIPI_MODEL_PATH` | Optional override for model path inside the backend service filesystem |
| `CORS_ORIGINS` | Optional comma-separated list of allowed frontend origins |

## Frontend

The frontend lives in `frontend/` and is hosted on Vercel. It calls the backend API through the deployed backend URL.

Keep frontend concerns inside `frontend/`. Keep backend concerns inside `backend/`.

## Requirements

Root notebook/training dependencies:

```bash
pip install -r requirements.txt
```

Backend runtime dependencies:

```bash
cd backend
pip install -r requirements.txt
```

## Team Rules

- Use VS Code for notebook editing.
- Use the Google Colab ipykernel from VS Code when GPU/Drive access is needed.
- Do not edit notebooks directly in the Colab web UI unless there is no alternative.
- Do not commit datasets.
- Do not commit generated outputs unless intentionally sharing a result.
- Keep model artifacts timestamped.
- Choose a model only after checking evaluation metrics and confusion matrix.
- Copy the selected deployment model into `backend/models/odia_ocr_cnn.keras`.
- Keep backend deployable from `backend/` alone.
- Keep frontend deployable from `frontend/` alone.

## More Detail

See [project_plan.md](project_plan.md) for roadmap, responsibilities, and team process.
