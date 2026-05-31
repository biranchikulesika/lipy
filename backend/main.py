from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import List

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model_loader import load_prediction_bundle
from predict import predict_upload


class TopPrediction(BaseModel):
    label: str
    confidence: float


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    top_predictions: List[TopPrediction]


def _resolve_allowed_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS")
    if not raw:
        return ["*"]
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["*"]


app = FastAPI(title="Lipi OCR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_resolve_allowed_origins(),
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
