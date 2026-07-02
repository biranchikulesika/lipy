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
│   └── mini_dataset/
│
├── L.ipynb
├── README.md
├── project_plan.md
├── requirements.txt
└── .gitignore
```

## Dataset Workflow

The project's image dataset follows a strictly flat, hierarchical folder structure where the parent directory serves as the class name.

```text
mini_dataset/
├── CONS_KA/
├── CONS_KHA/
├── CONS_GA/
├── VOW_A/
└── ...
```

- Each image is dynamically sized, and preprocessed into grayscale tensors directly inside `notebooks/02_preprocessing.ipynb`.
- Classes containing fewer than `MIN_IMAGES = 25` images are automatically ignored to ensure training stability and prevent extreme dataset imbalance.
- Data lives in Google Drive (`/content/drive/MyDrive/lipy/mini_dataset`) to facilitate Colab compute instances, but falls back to the local `data/mini_dataset/` structure for testing.

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
