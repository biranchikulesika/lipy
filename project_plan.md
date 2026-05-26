# Lipi

## Complete Project Plan

### Odia Handwritten OCR System

---

# 1. Project Overview

Lipi is a machine learning project focused on handwritten Odia character recognition.

The project aims to:

* Build a structured Odia OCR pipeline
* Create and manage handwritten Odia datasets
* Train deep learning models for character recognition
* Develop a deployable OCR system
* Support regional language AI research

---

# 2. Core Objectives

## Phase 1: Foundation

* Setup project architecture
* Setup GitHub workflow
* Setup Google Colab environment
* Setup Google Drive dataset storage
* Create label system
* Create initial handwritten dataset

## Phase 2: Dataset Engineering

* Collect handwritten character samples
* Build dataset indexing pipeline
* Create preprocessing pipeline
* Resize and normalize images
* Build train/test split pipeline
* Create data augmentation pipeline

## Phase 3: Machine Learning

* Train first CNN model
* Evaluate model accuracy
* Analyze prediction failures
* Improve preprocessing
* Experiment with architectures

## Phase 4: OCR System

* Build prediction pipeline
* Support full image inference
* Detect characters from uploaded images
* Build word-level recognition
* Build deployable OCR application

---

# 3. Technology Stack

| Category             | Tools              |
| -------------------- | ------------------ |
| Language             | Python             |
| IDE                  | VS Code            |
| Notebook Environment | Google Colab       |
| Version Control      | Git + GitHub       |
| Dataset Storage      | Google Drive       |
| Image Processing     | OpenCV, Pillow     |
| Data Handling        | Pandas, NumPy      |
| Visualization        | Matplotlib         |
| Deep Learning        | TensorFlow / Keras |
| Deployment           | Streamlit (later)  |

---

# 4. Project Workflow

## Development Workflow

```text
VS Code
   ↓
Git Push
   ↓
GitHub
   ↓
Colab Git Pull
   ↓
Model Training
```

---

## Dataset Workflow

```text
Local Dataset Collection
   ↓
Google Drive Upload
   ↓
Google Colab Access
   ↓
Preprocessing
   ↓
Training
```

---

# 5. Project Structure

```text
lipi/
│
├── data/
│   ├── raw/
│   ├── processed/
│   ├── samples/
│   └── mini_dataset/
│
├── notebooks/
│   ├── 01_dataset_exploration.ipynb
│   ├── 02_preprocessing.ipynb
│   ├── 03_first_cnn.ipynb
│   ├── 04_full_training.ipynb
│   └── 05_evaluation.ipynb
│
├── src/
│   ├── config/
│   │   └── labels.py
│   │
│   ├── preprocessing/
│   ├── training/
│   ├── evaluation/
│   └── deployment/
│
├── models/
├── outputs/
├── requirements.txt
├── README.md
└── lipi.ipynb
```

---

# 6. Google Drive Structure

```text
MyDrive/
└── lipi/
    ├── dataset/
    │   └── mini_dataset/
    │
    ├── models/
    ├── outputs/
    └── exports/
```

---

# 7. GitHub Workflow

## Initial Setup

### Initialize Git

```bash
git init
```

---

### Add Remote Repository

```bash
git remote add origin https://github.com/biranchikulesika/lipi.git
```

---

### First Push

```bash
git add .
git commit -m "Initial project setup"
git branch -M main
git push -u origin main
```

---

## Daily Workflow

### Push Local Changes

```bash
git add .
git commit -m "updated preprocessing"
git push
```

---

### Pull Latest Changes in Colab

```python
%cd /content/lipi
!git pull
```

---

# 8. Google Colab Workflow

## Clone Repository

```python
!git clone https://github.com/biranchikulesika/lipi.git
```

---

## Move into Project Folder

```python
%cd /content/lipi
```

---

## Mount Google Drive

```python
from google.colab import drive

drive.mount('/content/drive')
```

---

## Dataset Path

```python
DATASET_DIR = "/content/drive/MyDrive/lipi/dataset/mini_dataset"
```

---

# 9. Label System

The project uses structured ML-friendly labels.

Examples:

| Character | ML Label |
| --------- | -------- |
| କ         | CONS_KA  |
| ଖ         | CONS_KHA |
| ଅ         | VOW_A  |
| ୧         | DIGIT_1    |

---

# 10. Dataset Collection Guidelines

## Initial Dataset Goal

Start with:

* 5 to 10 classes
* 10 images per class

Example:

* CONS_KA
* CONS_KHA
* VOW_A
* VOW_AA
* DIGIT_0

---

## Image Collection Rules

### Good Images

* White background
* Dark pen or marker
* Proper lighting
* Centered character
* Tight crop
* One character per image

---

### Bad Images

* Blurry
* Shadowed
* Multiple characters
* Crooked orientation
* Fingers or objects visible

---

## Folder Example

```text
mini_dataset/
└── CONS_KA/
    ├── ka_1.jpg
    ├── ka_2.jpg
    └── ka_3.jpg
```

---

# 11. Notebook Responsibilities

## lipi.ipynb

Purpose:

* Project introduction
* Setup guide
* Dataset access
* Team onboarding

Do NOT use for:

* experiments
* random testing
* debugging
* model training

---

## notebooks/01_dataset_exploration.ipynb

Purpose:

* visualize dataset
* inspect classes
* analyze image distribution

---

## notebooks/02_preprocessing.ipynb

Purpose:

* resizing
* normalization
* thresholding
* augmentation

---

## notebooks/03_first_cnn.ipynb

Purpose:

* first CNN architecture
* basic training
* validation

---

## notebooks/04_full_training.ipynb

Purpose:

* larger dataset training
* checkpointing
* optimization

---

## notebooks/05_evaluation.ipynb

Purpose:

* confusion matrix
* prediction analysis
* error analysis
* evaluation metrics

---

# 12. Machine Learning Roadmap

## Stage 1

Learn:

* image loading
* labels
* folder-based datasets
* dataframe creation

---

## Stage 2

Learn:

* image preprocessing
* grayscale conversion
* resizing
* normalization

---

## Stage 3

Learn:

* CNN basics
* convolution layers
* pooling layers
* activation functions
* softmax classification

---

## Stage 4

Learn:

* training loops
* epochs
* batch size
* validation
* overfitting

---

## Stage 5

Learn:

* evaluation metrics
* confusion matrices
* prediction decoding
* deployment basics

---

# 13. Recommended Learning Order

1. Python basics
2. NumPy
3. Pandas
4. OpenCV
5. Image preprocessing
6. Neural network basics
7. CNN fundamentals
8. TensorFlow / Keras
9. OCR pipeline design
10. Deployment

---

# 14. Important Engineering Rules

## Rule 1

Never mix:

* experiments
* production code
* setup scripts

inside one notebook.

---

## Rule 2

GitHub stores:

* code
* notebooks
* configs

NOT datasets.

---

## Rule 3

Google Drive stores:

* datasets
* trained models
* outputs

---

## Rule 4

Always use:

* clear folder names
* consistent labels
* structured pipelines

---

## Rule 5

Debug data first.

Most ML problems are actually:

* dataset problems
* preprocessing problems
* labeling problems

not model problems.

---

# 15. Future Expansion Ideas

## Character-Level OCR

Recognize single handwritten characters.

---

## Word-Level OCR

Recognize complete handwritten words.

---

## Sentence-Level OCR

Recognize complete handwritten sentences.

---

## Mobile OCR App

Deploy OCR system on mobile devices.

---

## Web OCR Tool

Build browser-based OCR system using Streamlit.

---

# 16. Immediate Next Steps

## Current Priority

1. Collect initial handwritten dataset
2. Upload dataset to Google Drive
3. Verify dataset access in Colab
4. Build dataset dataframe
5. Visualize samples
6. Start preprocessing pipeline

---

# 17. Final Goal

Build a complete Odia handwritten OCR pipeline capable of:

* recognizing handwritten characters
* handling real-world image noise
* supporting regional language digitization
* enabling future NLP and OCR research for Odia language

---

# End of Project Plan
