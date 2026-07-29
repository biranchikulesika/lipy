from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass

import httpx

from config import config

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None
_client_lock = threading.Lock()


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = httpx.AsyncClient(
                    timeout=config.httpx_timeout,
                    limits=httpx.Limits(
                        max_keepalive_connections=5,
                        max_connections=10,
                        keepalive_expiry=60,
                    ),
                )
    return _client


@dataclass(frozen=True)
class TopPrediction:
    label: str
    confidence: float
    character: str | None = None


@dataclass(frozen=True)
class PredictionResult:
    status: str
    confidence: float
    top_predictions: list[TopPrediction]
    prediction: str | None = None
    character: str | None = None
    reason: str | None = None


class OCRError(Exception):
    pass


class APIUnavailableError(OCRError):
    pass


class InvalidImageError(OCRError):
    pass


class UnexpectedResponseError(OCRError):
    pass


def _safe_json(response: httpx.Response) -> dict:
    try:
        return response.json()
    except Exception:
        return {}


async def predict(image_bytes: bytes, filename: str, content_type: str) -> PredictionResult:
    start = time.perf_counter()

    client = _get_client()

    try:
        response = await client.post(
            config.predict_url,
            files={"image": (filename, image_bytes, content_type)},
        )
    except httpx.TimeoutException:
        elapsed = time.perf_counter() - start
        logger.error("API timeout after %.2fs", elapsed)
        raise APIUnavailableError("OCR service is taking too long. Please try again later.")
    except httpx.ConnectError:
        elapsed = time.perf_counter() - start
        logger.error("API connection failed after %.2fs", elapsed)
        raise APIUnavailableError("OCR service is currently unavailable.")
    except httpx.HTTPError as exc:
        elapsed = time.perf_counter() - start
        logger.error("API request failed after %.2fs: %s", elapsed, exc)
        raise APIUnavailableError("OCR service is currently unavailable.")

    elapsed = time.perf_counter() - start
    logger.info("API responded with status %d in %.2fs", response.status_code, elapsed)

    if response.status_code == 400:
        data = _safe_json(response)
        detail = data.get("detail", "Invalid request.")
        raise InvalidImageError(detail)

    if response.status_code != 200:
        logger.error("Unexpected API status %d: %s", response.status_code, response.text[:200])
        raise UnexpectedResponseError("OCR service returned an unexpected error.")

    data = _safe_json(response)
    if not data:
        raise UnexpectedResponseError("OCR service returned an empty response.")

    return _parse_response(data)


def _parse_response(data: dict) -> PredictionResult:
    try:
        top_predictions = [
            TopPrediction(
                label=p["label"],
                confidence=p["confidence"],
                character=p.get("character"),
            )
            for p in data["top_predictions"]
        ]

        return PredictionResult(
            status=data["status"],
            prediction=data.get("prediction"),
            confidence=data["confidence"],
            character=data.get("character"),
            reason=data.get("reason"),
            top_predictions=top_predictions,
        )
    except (KeyError, TypeError, IndexError) as exc:
        logger.error("Failed to parse API response: %s", exc)
        raise UnexpectedResponseError("OCR service returned an invalid response.") from exc
