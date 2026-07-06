# LiPy: Odia Handwritten OCR

LiPy is an open-source machine learning and computer vision project focused on handwritten Odia character recognition. 

It aims to support regional language AI research by providing a full, end-to-end pipeline covering custom dataset creation, deep learning model training, and real-time browser inference.

## Deployment Boundary

The project is split into separate, strictly bounded services to ensure modularity across development and hosting:

| Folder | Purpose | Stack | Hosting |
| --- | --- | --- | --- |
| [`frontend/`](frontend/README.md) | Web Application UI & Dataset Contributor | Next.js (App Router), Tailwind CSS | Vercel |
| [`backend/`](backend/README.md) | High-speed OCR Inference API | FastAPI, TensorFlow/Keras, OpenCV | Railway |
| `notebooks/` | ML Pipeline and Model Training workflow | Jupyter, Keras, Matplotlib | Local VS Code + Colab Kernel |

> [!WARNING]
> Runtime Isolation: The frontend code must never import backend code, and the backend must never import files from outside the `backend/` root.

## Project Structure

```text
lipy/
├── backend/
│   ├── models/
│   │   └── odia_ocr_cnn.keras
│   ├── __init__.py
│   ├── config.py
│   ├── labels.py
│   ├── main.py
│   ├── model_loader.py
│   ├── predict.py
│   ├── preprocess.py
│   ├── requirements.txt
│   ├── runtime.txt
│   └── Procfile
│
├── frontend/
│   ├── app/
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── lipyd/
│   │   │   └── page.tsx
│   │   ├── team/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── about/
│   │   │   └── AboutPanel.tsx
│   │   ├── lipyd/
│   │   │   ├── CanvasBoard.tsx
│   │   │   ├── CharacterSearch.tsx
│   │   │   ├── ContributorSetup.tsx
│   │   │   └── DatasetContributor.tsx
│   │   ├── navigation/
│   │   │   └── Navbar.tsx
│   │   ├── ocr/
│   │   │   ├── input/
│   │   │   │   ├── CameraMode.tsx
│   │   │   │   ├── DrawMode.tsx
│   │   │   │   ├── InputWorkspace.tsx
│   │   │   │   └── UploadMode.tsx
│   │   │   ├── results/
│   │   │   │   ├── PredictionCard.tsx
│   │   │   │   └── TopPredictions.tsx
│   │   │   └── OcrWorkspace.tsx
│   │   ├── team/
│   │   │   └── TeamPanel.tsx
│   │   └── ClientOnly.tsx
│   │
│   ├── constants/
│   │   ├── about.ts
│   │   ├── lipy.ts
│   │   ├── navigation.ts
│   │   └── team.ts
│   │
│   ├── hooks/
│   │   └── lipyd/
│   │       ├── useCanvasDrawing.ts
│   │       ├── useCharacterSelection.ts
│   │       └── useDatasetSync.ts
│   │
│   ├── lib/
│   │   ├── lipyd/
│   │   │   └── odiaCharacters.ts
│   │   └── api.ts
│   │
│   ├── public/
│   │   └── team/
│   │
│   ├── types/
│   │   ├── navigation.ts
│   │   └── ocr.ts
│   │
│   ├── .env.example
│   ├── eslint.config.mjs
│   ├── metadata.json
│   ├── next-env.d.ts
│   ├── next.config.mjs
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   └── tsconfig.json
│
├── notebooks/
│   ├── 01_dataset_exploration.ipynb
│   ├── 02_preprocessing.ipynb
│   ├── 03_first_cnn.ipynb
│   ├── 04_full_training.ipynb
│   └── 05_evaluation.ipynb
│
├── data/
│   └── dataset/
│       └── complete_dataset/
│
├── L.ipynb
├── README.md
├── project_plan.md
├── requirements.txt
└── .gitignore
```

## Dataset Workflow

The project's image dataset follows a completely flat structure where all images are stored directly inside a single folder without class subfolders. The filename itself contains the category class name:

```text
dataset/complete_dataset/
├── CONS_KA_C01_S01_0001_20260706T114309_a1b2c3d4.png
├── CONS_KHA_C01_S01_0002_20260706T114309_e5f6g7h8.png
├── VOW_A_C02_S01_0001_20260706T114309_1a2b3c4d.png
└── ...
```

- **Filename Format**: `{characterId}_{contributorId}_{sessionId}_{sampleNumber}_{timestamp}_{randomHash}.png`
  - `characterId`: The Odia character class code (first two parts split by `_`, e.g., `CONS_KA`, `VOW_A`).
  - `contributorId`: Unique browser contributor token.
  - `sessionId`: Session ID token (e.g., `S01`).
  - `sampleNumber`: Zero-padded 4-digit index showing samples of this character in this session.
  - `timestamp` & `randomHash`: For guaranteeing filename uniqueness.
- **Data Preprocessing**: Each image is loaded in color (RGB), resized to `64x64` dimensions, and normalized directly inside `notebooks/02_preprocessing.ipynb`.
- **Dataset Filtering**: Classes containing fewer than `MIN_IMAGES = 25` images (counted directly from file prefixes) are automatically ignored to ensure training stability and prevent class imbalance.
- **Storage Path**: Data lives in Google Drive (`/content/drive/MyDrive/lipy/dataset/complete_dataset`) to facilitate Colab compute instances, but falls back to a flat local `data/dataset/complete_dataset/` structure for local verification.

## Notebook Workflow

We utilize a modular notebook structure optimized for **VS Code**. 

1. Open a Jupyter Notebook locally in VS Code (e.g. `notebooks/04_full_training.ipynb`).
2. Attach the notebook to a remote Google Colab ipykernel using the *Google Colab extension*.
3. Execute the code locally while Colab provides the GPU compute and dataset storage.
4. **Master Notebook**: `L.ipynb` is a compiled, guided master-tutorial encompassing the entire 01-05 sequence.

## Model Output & Inference

When the `04_full_training.ipynb` (or `L.ipynb`) callback (ModelCheckpoint) fires on validation accuracy improvements, it exports a standalone `.keras` artifact.

1. **Dynamic Timestamping**: Models are saved with a precise timestamp: `odia_ocr_cnn_<YYYYMMDD_HHMMSS>.keras`.
2. **Auto-Copying**: The notebook exports directly to Google Drive (`/content/drive/MyDrive/lipy/models/`), and automatically attempts to copy the artifact to your local `backend/models/` folder.
3. **Backend Auto-Discovery**: You do not need to rename the model file. Upon startup, the FastAPI backend dynamically scans the `backend/models/` directory, sorts all `.keras` files by modification time, and automatically loads the most recently created model into an `lru_cache`.
