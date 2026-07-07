# Model Scripts

Utilities for managing trained LiPy OCR models.

## Scripts

| Script | Description |
|---------|-------------|
| download_hf.py | Download or update the Hugging Face model repository |
| validate.py | Validate exported model artifacts |
| upload_hf.py | Publish trained models to Hugging Face |

## Typical Workflow

```text
Train model
      │
      ▼
Validate model
      │
      ▼
Upload model to Hugging Face
      │
      ▼
Railway downloads latest model automatically
```