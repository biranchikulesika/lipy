# Scripts

This directory contains utility scripts used to manage LiPy datasets, trained models, and local project setup.

## Structure

```text
common/
    Shared utilities

dataset/
    Dataset download, upload, validation

model/
    Model download, upload, validation
```

## Installation

Install the required Python dependency:

```bash
pip install -r scripts/requirements.txt
```

Git must also be installed and available in your system `PATH`.

## Workflow

Initialize the project:

```bash
python scripts/common/setup.py
```

Download the latest dataset:

```bash
python scripts/dataset/download_hf.py
```

Validate assets:

```bash
python scripts/dataset/validate.py
python scripts/model/validate.py
```

Upload updated assets:

```bash
python scripts/dataset/upload_hf.py
python scripts/model/upload_hf.py
```

Each subdirectory contains its own README with additional details.