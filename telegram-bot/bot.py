from __future__ import annotations

import logging

from telegram.ext import Application, CallbackQueryHandler, CommandHandler, MessageHandler, filters

from config import config
from handlers import (
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

ALLOWED_UPDATES = ["message", "edited_message", "channel_post", "callback_query"]


def main() -> None:
    application = (
        Application.builder()
        .token(config.telegram_bot_token)
        .build()
    )

    application.add_handler(CommandHandler("start", start_handler))
    application.add_handler(CommandHandler("help", help_handler))
    application.add_handler(CommandHandler("about", about_handler))
    application.add_handler(CommandHandler("characters", characters_handler))
    application.add_handler(CommandHandler("grapheme", grapheme_handler))
    application.add_handler(CommandHandler("contribute", contribute_handler))
    application.add_handler(CommandHandler("stats", stats_handler))
    application.add_handler(CommandHandler("version", version_handler))
    application.add_handler(CallbackQueryHandler(callback_handler))
    application.add_handler(MessageHandler(filters.PHOTO & filters.ChatType.PRIVATE, photo_handler))
    application.add_handler(MessageHandler(filters.Document.IMAGE & filters.ChatType.PRIVATE, document_handler))
    application.add_handler(MessageHandler(filters.Sticker.ALL & filters.ChatType.PRIVATE, sticker_handler))
    application.add_handler(MessageHandler(filters.ANIMATION & filters.ChatType.PRIVATE, animation_handler))
    application.add_handler(MessageHandler(filters.VIDEO & filters.ChatType.PRIVATE, video_handler))
    application.add_handler(MessageHandler(filters.VIDEO_NOTE & filters.ChatType.PRIVATE, video_note_handler))
    application.add_handler(MessageHandler(filters.VOICE & filters.ChatType.PRIVATE, voice_handler))
    application.add_handler(MessageHandler(filters.AUDIO & filters.ChatType.PRIVATE, audio_handler))
    application.add_handler(MessageHandler(filters.LOCATION & filters.ChatType.PRIVATE, location_handler))
    application.add_handler(MessageHandler(filters.CONTACT & filters.ChatType.PRIVATE, contact_handler))
    application.add_handler(MessageHandler(filters.POLL & filters.ChatType.PRIVATE, poll_handler))
    application.add_handler(MessageHandler(filters.Dice() & filters.ChatType.PRIVATE, dice_handler))
    application.add_handler(MessageHandler(filters.INVOICE & filters.ChatType.PRIVATE, invoice_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND & filters.ChatType.PRIVATE, text_handler))

    logger.info("Bot starting in polling mode...")
    application.run_polling(allowed_updates=ALLOWED_UPDATES)


if __name__ == "__main__":
    main()
