from __future__ import annotations

import os
import sys
from dataclasses import dataclass, field

import httpx
from dotenv import load_dotenv

load_dotenv()

_HTTPX_TIMEOUT: httpx.Timeout | None = None


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        print(f"Error: Environment variable {name} is not set.", file=sys.stderr)
        print(f"Copy .env.example to .env and fill in the required values.", file=sys.stderr)
        sys.exit(1)
    return value


def _float_env(name: str, default: str) -> float:
    raw = os.getenv(name, default)
    try:
        return float(raw)
    except (ValueError, TypeError):
        print(f"Warning: Invalid value for {name} ({raw!r}), using default {default}.", file=sys.stderr)
        return float(default)


@dataclass(frozen=True)
class Config:
    telegram_bot_token: str = field(default_factory=lambda: _require_env("TELEGRAM_BOT_TOKEN"))
    lipy_api_url: str = field(default_factory=lambda: os.getenv("LIPY_API_URL", "https://api.lipy.app"))
    api_timeout: float = field(default_factory=lambda: _float_env("API_TIMEOUT", "30"))
    api_connect_timeout: float = field(default_factory=lambda: _float_env("API_CONNECT_TIMEOUT", "10"))
    webhook_secret: str = field(default_factory=lambda: os.getenv("WEBHOOK_SECRET", ""))
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    max_image_size_mb: float = field(default_factory=lambda: _float_env("MAX_IMAGE_SIZE_MB", "10"))

    @property
    def predict_url(self) -> str:
        return f"{self.lipy_api_url.rstrip('/')}/predict"

    @property
    def health_url(self) -> str:
        return f"{self.lipy_api_url.rstrip('/')}/health"

    @property
    def max_image_size_bytes(self) -> int:
        return int(self.max_image_size_mb * 1024 * 1024)

    @property
    def httpx_timeout(self) -> httpx.Timeout:
        global _HTTPX_TIMEOUT
        if _HTTPX_TIMEOUT is None:
            _HTTPX_TIMEOUT = httpx.Timeout(self.api_timeout, connect=self.api_connect_timeout)
        return _HTTPX_TIMEOUT


config = Config()
