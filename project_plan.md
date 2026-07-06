# LiPy Project Plan

## 1. Goal

LiPy is an Odia handwritten character recognition project. The immediate goal is high-accuracy single-character OCR. The longer-term goal is a usable OCR system that can support word-level and document-level Odia recognition.

The project has three main work areas:

- Dataset collection and curation
- Model training and evaluation
- Web deployment through an independent frontend and backend

## 2. Current Team Workflow

We no longer use the Google Colab website as the primary editing environment.

The team writes and runs notebooks in VS Code, then connects those notebook cells to a Google Colab ipykernel through the VS Code Google Colab extension. This gives us:

- VS Code editing, Git, and file navigation
- Colab GPU/TPU compute when needed
- Google Drive access for large datasets and trained models
- A normal repository workflow without manually editing notebooks in the Colab web UI

## 3. Development Flow

```text
VS Code
  -> open repository
  -> open notebook from notebooks/
  -> connect notebook kernel to Google Colab ipykernel
  -> run cells using Colab compute
  -> save notebook changes locally
  -> commit and push changes with Git
```

Team members should treat VS Code as the source of truth for notebook edits. Colab is used as the remote Python runtime, not as the main place to manage project files.

## 4. Repository Structure

```text
lipy/
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
|   `-- dataset/
|       `-- complete_dataset/
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
|-- requirements.txt
`-- requirements.txt
```

Important deployment rule:

- `frontend/` is deployed independently on Vercel.
- `backend/` is deployed independently on Railway.
- Railway selects the `backend/` folder, so backend runtime code must not require files outside `backend/`.
- Vercel selects the `frontend/` folder, so frontend runtime code must not require files outside `frontend/`.

## 5. Dataset Structure

The reference notebook `L.ipynb` defines the dataset format. Training notebooks follow the same structure:

```text
dataset/complete_dataset/
├── CONS_KA_C01_S01_0001_20260706T114309_a1b2c3d4.png
├── CONS_KHA_C01_S01_0002_20260706T114309_e5f6g7h8.png
├── VOW_A_C02_S01_0001_20260706T114309_1a2b3c4d.png
└── ...
```

Each image resides directly inside the `complete_dataset` directory. The classification label (e.g. `CONS_KA`, `VOW_A`) is parsed from the first two parts of the filename when split by `_`.

The notebooks use:

- `MIN_IMAGES = 25` (computed from file prefixes)
- sorted valid class labels list
- `label_map = {class_name: integer_id}`
- color image loading (RGB)
- resize to `64 x 64`
- normalization to `0..1`
- final shape `(samples, 64, 64, 3)`

## 6. Google Drive Layout

Google Drive stores large files that should not live in Git.

Recommended Drive paths:

```text
MyDrive/
|-- lipy/
|   `-- dataset/
|       `-- complete_dataset/
`-- lipy_models/
    `-- LiPy_odia_ocr_<model_family>_<YYYYMMDD_HHMMSS>.keras
```

The default notebook dataset path is:

```text
/content/drive/MyDrive/lipy/dataset/complete_dataset
```

The default Google Drive model output path is:

```text
/content/drive/MyDrive/lipy_models/
```

## 7. Local Artifact Layout

Notebook-generated files are saved under `outputs/`:

```text
outputs/
|-- metrics/
|-- models/
`-- training/
```

Model naming convention:

```text
lipy_odia_ocr_<model_family>_<YYYYMMDD_HHMMSS>.keras
```

Examples:

```text
lipy_odia_ocr_baseline_cnn_20260615_153000.keras
lipy_odia_ocr_full_cnn_best_20260615_161500.keras
```

Do not train directly into `backend/models/`. After evaluating models, copy the chosen deployment model to:

```text
backend/models/odia_ocr_cnn.keras
```

## 8. Notebook Responsibilities

### `L.ipynb`

Reference notebook. Use it to understand the original data layout, label creation, and preprocessing approach.

### `notebooks/01_dataset_exploration.ipynb`

Use for:

- dataset path verification
- class folder inspection
- image count summaries
- sample visualization

### `notebooks/02_preprocessing.ipynb`

Use for:

- RGB color conversion
- resizing
- normalization
- shape verification
- visual inspection of processed samples

### `notebooks/03_first_cnn.ipynb`

Use for:

- EfficientNetB0 baseline architecture configuration
- transfer learning configuration with ImageNet weights
- confirming the dataset can learn

### `notebooks/04_full_training.ipynb`

Use for:

- accuracy-focused training
- data augmentation
- class weighting
- best-model checkpointing
- local and Google Drive model saving
- training curves

### `notebooks/05_evaluation.ipynb`

Use for:

- loading a saved model
- accuracy, precision, recall, F1
- classification report
- confusion matrix
- prediction inspection

## 9. Training Workflow

1. Open VS Code.
2. Open the `lipy` repository.
3. Open a notebook from `notebooks/`.
4. Connect the notebook kernel to the Google Colab ipykernel using the VS Code Google Colab extension.
5. Run the setup cells.
6. Verify the dataset path and class counts.
7. Run preprocessing and training.
8. Save generated model artifacts locally and to Google Drive.
9. Evaluate the model.
10. Copy the chosen `.keras` file into `backend/models/odia_ocr_cnn.keras` for deployment.

## 10. Backend Workflow

The backend is a FastAPI service hosted on Railway.

Local run:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Railway service folder:

```text
backend/
```

Railway start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Backend model path:

```text
backend/models/odia_ocr_cnn.keras
```

## 11. Frontend Workflow

The frontend is hosted separately on Vercel and lives in `frontend/`.

The frontend communicates with the backend through the backend API URL. Frontend deployment and implementation details are intentionally kept separate from backend and notebook work.

## 12. Engineering Rules

- Do not commit datasets to Git.
- Do not commit notebook output artifacts unless there is a clear reason.
- Keep backend runtime self-contained inside `backend/`.
- Keep frontend runtime self-contained inside `frontend/`.
- Keep experimental training outputs in `outputs/` and Google Drive.
- Use clear timestamped model names.
- Evaluate with a confusion matrix before choosing a deployment model.
- Update `README.md` whenever workflow, structure, or deployment expectations change.

## 13. Roadmap

### Current

- Improve dataset quality
- Train stronger single-character OCR models
- Evaluate class-level failures with confusion matrices
- Select stable deployment models

### Next

- Expand dataset size and writer diversity
- Improve preprocessing for camera/upload images
- Add more robust model architectures
- Automate model comparison reports

### Later

- Word-level OCR
- Line-level OCR
- Sentence/document OCR
- Mobile-friendly OCR workflows

## 14. Success Criteria

The project is healthy when:

- New team members can understand the workflow from `README.md`.
- Notebooks can run from VS Code using the Colab ipykernel.
- Dataset labels are consistent across training and backend inference.
- Model artifacts are clearly named and saved locally plus Google Drive.
- Backend can deploy on Railway using only files inside `backend/`.
- Frontend can deploy on Vercel using only files inside `frontend/`.
