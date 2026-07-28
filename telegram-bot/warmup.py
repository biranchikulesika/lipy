"""Background API warm-up to reduce Azure cold-start latency.

Azure Container Apps with minReplicas=0 scales the container down to zero
after inactivity. The first user request then pays the cold-start penalty.
This module sends a dummy prediction request on /start so the container is
already warm by the time the user submits their first real image.

The warm-up is fire-and-forget: failures are logged but never surface to
the user or affect the normal OCR flow.
"""

from __future__ import annotations

import logging
import time
from pathlib import Path

import httpx

from config import config

logger = logging.getLogger(__name__)

_WARMUP_IMAGE = Path(__file__).parent / "assets" / "warmup.png"


async def warmup_api() -> None:
    """Send a dummy prediction request to wake the Azure container."""
    if not _WARMUP_IMAGE.exists():
        logger.warning("Warm-up image not found at %s, skipping", _WARMUP_IMAGE)
        return

    logger.info("API warm-up started")
    start = time.perf_counter()

    try:
        async with httpx.AsyncClient(timeout=config.api_timeout) as client:
            image_bytes = _WARMUP_IMAGE.read_bytes()
            response = await client.post(
                config.predict_url,
                files={"image": ("warmup.png", image_bytes, "image/png")},
            )
        elapsed = time.perf_counter() - start
        logger.info("API warm-up completed in %.2fs (status %d)", elapsed, response.status_code)
    except Exception as exc:
        elapsed = time.perf_counter() - start
        logger.warning("API warm-up failed after %.2fs: %s", elapsed, exc)
