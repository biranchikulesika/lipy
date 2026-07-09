# LiPy: Odia Handwritten OCR

LiPy is an open-source Optical Character Recognition (OCR) project for handwritten Odia characters. It combines a TensorFlow-based recognition model, a FastAPI inference backend, a modern web frontend, and a reproducible training pipeline.

The project is designed around a simple principle:

- **GitHub** stores source code.
- **Hugging Face** stores datasets and trained models.
- **Supabase** stores operational contributor data.

This keeps the repository lightweight while allowing datasets and model versions to evolve independently.

---

# Repository Architecture

LiPy separates code, datasets, trained models, and contributor data into independent repositories.

| Component | Source of Truth |
|------------|-----------------|
| Source Code | GitHub |
| Training Datasets | Hugging Face Dataset |
| Trained Models | Hugging Face Model |
| Contributor Data | Supabase |

Large assets are intentionally **not versioned inside GitHub**.

---

# Project Structure

```text
lipy/
│
├── backend/                 # FastAPI inference backend
│
├── frontend/                # Next.js web application
│
├── dataset/                 # Local Hugging Face dataset repository
│   ├── complete_dataset/
│   ├── mini_dataset/
│   └── ...
│
├── models/                  # Local Hugging Face model repository
│   ├── model.keras
│   ├── labels.json
│   └── training_history.json
│
├── notebooks/
│   └── L.ipynb              # End-to-end training notebook
│
├── scripts/
│   ├── common/              # Shared utilities
│   ├── dataset/             # Dataset management
│   ├── model/               # Model management
│   └── requirements.txt
│
├── .env.example
└── README.md
```

---

# Directory Overview

| Directory | Description |
|-----------|-------------|
| `backend/` | FastAPI backend responsible for OCR inference |
| `frontend/` | Web interface for handwriting recognition |
| `dataset/` | Local nested Git repository containing datasets |
| `models/` | Local nested Git repository containing trained models |
| `notebooks/` | Training notebooks and experiments |
| `scripts/` | Utilities for downloading, validating, and publishing datasets and models |

---

# Repository Workflow

```text
                GitHub
          (Source Code Only)
                   │
                   ▼
            Clone Repository
                   │
                   ▼
        Initialize Local Workspace
                   │
                   ▼
      Download Dataset from HF
                   │
                   ▼
      Download Model from HF
                   │
                   ▼
          Train Using L.ipynb
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
 Update Dataset         Export Model
         │                   │
         ▼                   ▼
 Upload Dataset      Upload Model
 to Hugging Face     to Hugging Face
         │                   │
         └─────────┬─────────┘
                   ▼
          Backend Deployment
              (Railway)
```

---

# Quick Start

Clone the repository.

```bash
git clone https://github.com/biranchikulesika/lipy.git
cd lipy
```

Create the environment file.

```bash
cp .env.example .env
```

Install the shared script dependencies.

```bash
pip install -r scripts/requirements.txt
```

Initialize the local workspace.

```bash
python scripts/common/setup.py
```

This prepares the local `dataset/` and `models/` repositories by cloning or updating them from Hugging Face.

---

# Environment Variables

```bash
HF_DATASET_REPO_ID=biranchikulesika/lipy
HF_DATASET_FOLDER=complete_dataset

HF_MODEL_REPO_ID=biranchikulesika/lipy

# Required only for uploads or private repositories.
HF_TOKEN=hf_xxxxxxxxx
```

Additional variables used by Supabase synchronization are documented in `.env.example`.

---

# Documentation

Each major component contains its own documentation.

| Directory | Description |
|-----------|-------------|
| `backend/README.md` | Backend API, inference pipeline, deployment, and Railway setup |
| `frontend/README.md` | Frontend setup and development |
| `scripts/README.md` | Dataset and model management utilities |
| `notebooks/L.ipynb` | Complete training workflow from dataset download to model export |

---

# Technology Stack

- TensorFlow / Keras
- FastAPI
- Next.js
- Hugging Face Hub
- Supabase
- Railway
- Docker
