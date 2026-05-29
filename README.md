# Lipi

Lipi is a production-ready MVP for Odia handwritten character recognition.

The app is split into two deployable services:

- Frontend: Next.js + TypeScript + Tailwind on Vercel
- Backend: FastAPI + TensorFlow on Render

The browser never runs ML preprocessing or inference. Images are always sent to the backend through multipart/form-data, preprocessed there, and then passed into the TensorFlow model.

## Repository Layout

```text
lipi/
├── frontend/
├── backend/
├── models/
│   └── odia_ocr_cnn.keras
├── notebooks/
├── data/
├── src/
├── README.md
└── .gitignore
```

## Local Development

### Backend

1. Place the trained model at models/odia_ocr_cnn.keras.
2. Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Run the API:

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

If you prefer to run from the repo root, use `uvicorn backend.main:app` instead.

### Frontend

1. Install frontend dependencies:

```bash
cd frontend
npm install
```

2. Create frontend/.env.local:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Run the app:

```bash
npm run dev
```

## API

POST /predict

Request:

```text
multipart/form-data
image=<uploaded image>
```

Response:

```json
{
	"prediction": "CONS_KA",
	"confidence": 0.94,
	"top_predictions": [
		{ "label": "CONS_KA", "confidence": 0.94 },
		{ "label": "CONS_KHA", "confidence": 0.03 },
		{ "label": "CONS_GA", "confidence": 0.01 }
	]
}
```

## Deployment

### Vercel

1. Set the project root to frontend/.
2. Add NEXT_PUBLIC_API_URL with the Render backend URL.
3. Build command: npm run build.

### Render

1. Create a Python web service from the repo root or the backend/ folder.
2. Install command:

```bash
pip install -r backend/requirements.txt
```

3. Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

If the service root is the repository root, use `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` instead.

4. Set CORS_ORIGINS to your Vercel domain if you want to lock CORS down.

## Environment Variables

Frontend:

- NEXT_PUBLIC_API_URL

Backend:

- LIPI_MODEL_PATH optional override for models/odia_ocr_cnn.keras
- CORS_ORIGINS optional comma-separated allowlist

## Notes

- The training label order is sourced from src/config/labels.py.
- The backend loads the TensorFlow model once at startup and reuses it for every request.
