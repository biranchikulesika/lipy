from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .config import (
        API_DESCRIPTION,
        API_TITLE,
        API_VERSION,
        get_allowed_origins,
    )
    from .model_loader import load_prediction_bundle
    from .predict import predict_upload
except ImportError:
    from config import (
        API_DESCRIPTION,
        API_TITLE,
        API_VERSION,
        get_allowed_origins,
    )
    from model_loader import load_prediction_bundle
    from predict import predict_upload


# =============================================================================
# Response Models
# =============================================================================

class TopPrediction(BaseModel):
    label: str
    confidence: float
    character: str | None = None


class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    character: str | None = None
    top_predictions: list[TopPrediction]


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Startup
# =============================================================================

@app.on_event("startup")
def warm_model() -> None:
    """Load the OCR model during application startup."""

    load_prediction_bundle()


# =============================================================================
# Routes
# =============================================================================

@app.get("/")
def read_root() -> dict[str, str]:
    """API root endpoint."""

    return {
        "message": (
            "Welcome to the LiPy OCR API! "
            "Visit /docs for interactive documentation."
        )
    }


@app.get("/health")
def health() -> dict[str, str]:
    """Health check endpoint."""

    return {
        "status": "ok"
    }


@app.post(
    "/predict",
    response_model=PredictionResponse,
)
async def predict(
    image: UploadFile = File(...)
) -> dict:
    """Predict the handwritten Odia character."""

    try:
        return predict_upload(image)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Model prediction failed.",
        ) from exc