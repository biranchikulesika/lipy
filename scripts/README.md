# Scripts

This directory contains utility scripts used to manage LiPy datasets and project setup.

## Structure

```text
common/
    Shared utilities

dataset/
    Dataset download
```

## Installation

Install the required Python dependency:

```bash
pip install -r scripts/requirements.txt
```

Git and the Hugging Face CLI (`hf`) must also be installed and available in your system `PATH`.

## Workflow

### 1. Clone from GitHub

```bash
git clone https://github.com/biranchikulesika/lipy.git
cd lipy
```

### 2. Set up folder structure

```bash
python scripts/common/setup.py
```

### 3. Pull assets from Hugging Face

```bash
cd dataset && hf pull && cd ..
cd models  && hf pull && cd ..
```

### 4. Dataset maintenance

Download new samples from Supabase:

```bash
python scripts/dataset/download_supabase.py
```

Create zip and push updated dataset to HF:

```bash
cd dataset
rm -f complete_dataset.zip
zip -r complete_dataset.zip complete_dataset/
git add complete_dataset.zip README.md .gitattributes
git commit -m "Update dataset snapshot"
git push origin main
cd ..
```

### 5. Model maintenance

Push updated model to HF:

```bash
cd models
hf upload .
cd ..
```

Each subdirectory contains its own README with additional details.
