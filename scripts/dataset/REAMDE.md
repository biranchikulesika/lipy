# Dataset Scripts

Utilities for downloading, validating, and publishing LiPy datasets.

## Scripts

| Script | Description |
|---------|-------------|
| download_hf.py | Download or update the Hugging Face dataset repository |
| download_supabase.py | Download verified samples from Supabase |
| validate.py | Validate dataset integrity |
| upload_hf.py | Publish the dataset to Hugging Face |

## Typical Workflow

```text
Download from Hugging Face
        │
        ▼
Download new samples from Supabase
        │
        ▼
Validate dataset
        │
        ▼
Upload updated dataset to Hugging Face
```