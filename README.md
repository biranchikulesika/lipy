# LiPy: Odia Handwritten OCR

LiPy is an OCR project for handwritten Odia characters. The repo contains the application code, training workflow, and sync scripts. Large/generated assets are intentionally kept outside Git.

## Source Of Truth

- GitHub owns source code: `backend/`, `frontend/`, `notebooks/`, `scripts/`, and docs.
- Hugging Face Dataset owns versioned training dataset snapshots.
- Hugging Face Model owns versioned trained model artifacts.
- Supabase owns operational/raw contributor data.
- Local `dataset/` and `models/` folders are independent nested Git working copies.

Nothing large should be versioned in more than one place.

## Project Structure

```text
lipy/
├── backend/                 # FastAPI inference API
├── frontend/                # Next.js app
├── notebooks/               # Training/evaluation notebooks
├── scripts/
│   ├── setup.py
│   ├── dataset/
│   │   ├── download_hf.py
│   │   ├── upload_hf.py
│   │   ├── download_supabase.py
│   │   └── validate.py
│   └── model/
│       ├── download_hf.py
│       ├── upload_hf.py
│       └── verify.py
├── dataset/                 # Nested Git repo, HF Dataset, ignored by outer Git
├── models/                  # Nested Git repo, HF Model, ignored by outer Git
├── training_requirements.txt
├── README.md
└── .env.example
```

## Bootstrap

Install Python dependencies for scripts/training, configure `.env`, then fetch disposable assets:

```bash
pip install -r training_requirements.txt
cp .env.example .env
python scripts/setup.py
```

Required Hugging Face variables:

```bash
HF_DATASET_REPO_ID=biranchikulesika/lipy
HF_MODEL_REPO_ID=biranchikulesika/lipy
HF_TOKEN=hf_xxx # only for private repos or uploads
```

## Dataset Workflow

Clone or update the dataset working copy from Hugging Face:

```bash
python scripts/dataset/download_hf.py
python scripts/dataset/validate.py
```

By default this prepares a nested Git repo at:

```text
dataset/
```

Validate the default training folder:

```bash
python scripts/dataset/validate.py
```

Refresh from Supabase operational data:

```bash
python scripts/dataset/download_supabase.py
python scripts/dataset/validate.py
python scripts/dataset/upload_hf.py
```

Training notebooks read from `dataset/complete_dataset/` by default after the dataset repo has been downloaded.

## Model Workflow

Training writes local artifacts to:

```text
models/model.keras
models/labels.json
models/training_history.json
```

Verify and upload the selected trained model:

```bash
python scripts/model/verify.py
python scripts/model/upload_hf.py
```

Clone or update the model working copy:

```bash
python scripts/model/download_hf.py
```

The backend never trains. Training releases are uploaded from root `models/` to Hugging Face, and Railway restores model artifacts into `models/` during startup.

## Backend

Local run:

```bash
pip install -r backend/requirements.txt
python scripts/model/download_hf.py
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

Railway startup downloads the latest model from `https://huggingface.co/biranchikulesika/lipy` through `backend/download_model.py` before starting FastAPI if model files are missing.

Docker:

```bash
cd backend
docker build -t lipy-backend .
docker run --rm -p 8000:8000 --env-file .env lipy-backend
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```
