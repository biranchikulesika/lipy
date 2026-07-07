# LiPy Project Plan

## Ownership

- GitHub is the source of truth for code.
- Supabase is the operational source for newly collected handwriting samples.
- Hugging Face Dataset is the source of truth for versioned training snapshots.
- Hugging Face Model is the source of truth for trained model artifacts.
- Local `dataset/` and `models/` folders are disposable working copies.

## Repository Layout

```text
backend/                  FastAPI inference API
frontend/                 Next.js frontend and contributor app
notebooks/                Notebook-based training/evaluation workflow
scripts/setup.py          One-command local bootstrap
scripts/dataset/          Dataset download/upload/validation scripts
scripts/model/            Model download/upload/verification scripts
dataset/                  Local dataset working copy, Git ignored
models/                   Local model working copy, Git ignored
```

## Rules

1. Git never tracks `dataset/` or `models/`.
2. Training reads from local `dataset/`, never directly from Hugging Face.
3. Training writes selected artifacts to `models/model.keras`, `models/labels.json`, and optionally `models/training_history.json`.
4. Backend never trains. Runtime loads `models/model.keras` after `backend/download_model.py` downloads it from Hugging Face if needed.
5. Only scripts communicate with Hugging Face.
6. Local working folders must be recoverable with:

```bash
python scripts/dataset/download_hf.py
python scripts/model/download_hf.py
```

## Standard Workflow

```bash
git clone https://github.com/biranchikulesika/lipy
cd lipy
pip install -r training_requirements.txt
cp .env.example .env
python scripts/setup.py
```

Dataset refresh:

```bash
python scripts/dataset/download_supabase.py
python scripts/dataset/validate.py
python scripts/dataset/upload_hf.py
```

Model release:

```bash
python scripts/model/verify.py
python scripts/model/upload_hf.py
```

Backend release/runtime:

```bash
python backend/download_model.py
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
