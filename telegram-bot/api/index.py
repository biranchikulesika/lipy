from __future__ import annotations

import asyncio
import hmac
import json
import logging
import os
import sys
import threading

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import config
from telegram import Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, MessageHandler, filters

from handlers import (
    _warmup_handler,
    about_handler,
    animation_handler,
    audio_handler,
    callback_handler,
    characters_handler,
    contact_handler,
    contribute_handler,
    dice_handler,
    document_handler,
    grapheme_handler,
    help_handler,
    invoice_handler,
    location_handler,
    photo_handler,
    poll_handler,
    start_handler,
    stats_handler,
    sticker_handler,
    text_handler,
    video_handler,
    video_note_handler,
    version_handler,
    voice_handler,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=getattr(logging, config.log_level.upper(), logging.INFO),
)
logger = logging.getLogger(__name__)

_loop: asyncio.AbstractEventLoop | None = None
_loop_lock = threading.Lock()
_app: Application | None = None


def _ensure_loop() -> asyncio.AbstractEventLoop:
    global _loop
    with _loop_lock:
        if _loop is not None and _loop.is_running():
            return _loop
        _loop = asyncio.new_event_loop()
        threading.Thread(target=_loop.run_forever, daemon=True).start()
        logger.info("Persistent event loop started")
        return _loop


async def _ensure_app() -> Application:
    global _app
    if _app is not None:
        return _app
    app = (
        Application.builder()
        .token(config.telegram_bot_token)
        .build()
    )
    app.add_handler(MessageHandler(filters.ALL, _warmup_handler), group=-1)
    app.add_handler(CommandHandler("start", start_handler))
    app.add_handler(CommandHandler("help", help_handler))
    app.add_handler(CommandHandler("about", about_handler))
    app.add_handler(CommandHandler("characters", characters_handler))
    app.add_handler(CommandHandler("grapheme", grapheme_handler))
    app.add_handler(CommandHandler("contribute", contribute_handler))
    app.add_handler(CommandHandler("stats", stats_handler))
    app.add_handler(CommandHandler("version", version_handler))
    app.add_handler(CallbackQueryHandler(callback_handler))
    app.add_handler(MessageHandler(filters.PHOTO & filters.ChatType.PRIVATE, photo_handler))
    app.add_handler(MessageHandler(filters.Document.IMAGE & filters.ChatType.PRIVATE, document_handler))
    app.add_handler(MessageHandler(filters.Sticker.ALL & filters.ChatType.PRIVATE, sticker_handler))
    app.add_handler(MessageHandler(filters.ANIMATION & filters.ChatType.PRIVATE, animation_handler))
    app.add_handler(MessageHandler(filters.VIDEO & filters.ChatType.PRIVATE, video_handler))
    app.add_handler(MessageHandler(filters.VIDEO_NOTE & filters.ChatType.PRIVATE, video_note_handler))
    app.add_handler(MessageHandler(filters.VOICE & filters.ChatType.PRIVATE, voice_handler))
    app.add_handler(MessageHandler(filters.AUDIO & filters.ChatType.PRIVATE, audio_handler))
    app.add_handler(MessageHandler(filters.LOCATION & filters.ChatType.PRIVATE, location_handler))
    app.add_handler(MessageHandler(filters.CONTACT & filters.ChatType.PRIVATE, contact_handler))
    app.add_handler(MessageHandler(filters.POLL & filters.ChatType.PRIVATE, poll_handler))
    app.add_handler(MessageHandler(filters.Dice() & filters.ChatType.PRIVATE, dice_handler))
    app.add_handler(MessageHandler(filters.INVOICE & filters.ChatType.PRIVATE, invoice_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND & filters.ChatType.PRIVATE, text_handler))
    await app.initialize()
    _app = app
    logger.info("Application initialized successfully")
    return _app


async def _process_update(update_json: dict) -> None:
    app = await _ensure_app()
    update = Update.de_json(update_json, app.bot)
    await app.process_update(update)


def _check_secret(environ: dict) -> bool:
    if not config.webhook_secret:
        return True
    token = environ.get("HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN", "")
    return hmac.compare_digest(token, config.webhook_secret)


class handler:
    def __init__(self, environ, start_response):
        self.environ = environ
        self.start_response = start_response

    def __iter__(self):
        path = self.environ.get("PATH_INFO", "/")
        method = self.environ.get("REQUEST_METHOD", "GET")

        if path == "/health" and method == "GET":
            body = json.dumps({"status": "ok"}).encode()
            self.start_response("200 OK", [("Content-Type", "application/json")])
            yield body
            return

        if method == "POST":
            if not _check_secret(self.environ):
                logger.warning("Webhook request rejected: invalid secret token")
                body = json.dumps({"error": "Forbidden"}).encode()
                self.start_response("403 Forbidden", [("Content-Type", "application/json")])
                yield body
                return

            content_length = int(self.environ.get("CONTENT_LENGTH", 0) or 0)
            if content_length > 10 * 1024 * 1024:
                body = json.dumps({"error": "Payload too large"}).encode()
                self.start_response("413 Payload Too Large", [("Content-Type", "application/json")])
                yield body
                return

            raw_body = self.environ["wsgi.input"].read(content_length)

            try:
                update_json = json.loads(raw_body)
            except json.JSONDecodeError:
                logger.warning("Invalid JSON in webhook request body")
                self.start_response("400 Bad Request", [("Content-Type", "application/json")])
                yield json.dumps({"error": "Invalid JSON"}).encode()
                return

            try:
                loop = _ensure_loop()
                future = asyncio.run_coroutine_threadsafe(
                    _process_update(update_json), loop
                )
                future.result(timeout=25)
            except Exception:
                logger.exception("Failed to process Telegram update")

            self.start_response("200 OK", [("Content-Type", "application/json")])
            yield json.dumps({"ok": True}).encode()
            return

        self.start_response("404 Not Found", [("Content-Type", "application/json")])
        yield json.dumps({"error": "Not found"}).encode()
