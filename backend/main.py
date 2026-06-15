from __future__ import annotations

from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .config import get_allowed_origins
    from .model_loader import load_prediction_bundle
    from .predict import predict_upload
except ImportError:
    from config import get_allowed_origins
    from model_loader import load_prediction_bundle
    from predict import predict_upload


class TopPrediction(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    top_predictions: List[TopPrediction]


app = FastAPI(title="LiPy OCR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def warm_model() -> None:
    load_prediction_bundle()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
async def predict(image: UploadFile = File(...)) -> dict:
    try:
        return predict_upload(image)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Model prediction failed.") from exc
