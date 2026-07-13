# Dataset Scripts

Utilities for downloading LiPy datasets.

## Scripts

| Script | Description |
|---------|-------------|
| download_supabase.py | Download verified samples from Supabase |

## HF Dataset Repo Structure

```
dataset/                          # HF dataset repo root
├── README.md
├── complete_dataset/             # folder with sample images
│   ├── VOWEL_A_...png
│   └── ...
├── complete_dataset.zip          # zipped archive of complete_dataset/
└── .gitattributes
```

## Typical Workflow

### Pull latest dataset

```bash
cd dataset
hf pull
cd ..
```

### Add new samples

```bash
cd dataset
python scripts/dataset/download_supabase.py
cd ..
```

### Create zip and push to HF

```bash
cd dataset
rm -f complete_dataset.zip
zip -r complete_dataset.zip complete_dataset/
git add complete_dataset.zip README.md .gitattributes
git commit -m "Update dataset snapshot"
git push origin main
cd ..
```

**Always run HF commands from inside `dataset/`**, since that is the HF dataset repo root.
