from __future__ import annotations

import asyncio
import io
import logging
import time

from PIL import Image
from telegram import (InlineKeyboardButton, InlineKeyboardMarkup, Message,
                      Update)
from telegram.error import TelegramError
from telegram.ext import ContextTypes

import odia
from api_client import (APIUnavailableError, InvalidImageError,
                        PredictionResult, UnexpectedResponseError, predict)
from config import config
from warmup import warmup_api

logger = logging.getLogger(__name__)

BOT_VERSION = "2.0.0"
MODEL_VERSION = "1.0.0"
API_VERSION = "1.0.0"
DATASET_VERSION = "1.0.0"

# ── Text constants ─────────────────────────────────────────────────────────

CANVAS_CAPTION = (
    "Draw one Odia character.\n\n"
    "1. Tap the image.\n"
    "2. Choose Edit.\n"
    "3. Select the Brush tool.\n"
    "4. Draw one character.\n"
    "5. Send the edited image back.\n\n"
    "Or simply send an existing image instead."
)

WELCOME_TEXT = (
    "<b>Welcome to LiPy OCR!</b>\n\n"
    "I recognise handwritten and printed Odia characters "
    "using deep learning.\n\n"
    "You can:\n"
    "\u2022 Draw directly using Telegram\n"
    "\u2022 Send an existing image\n"
    "\u2022 Send a scanned character\n\n"
    "A blank canvas is provided below."
)

HELP_TEXT = (
    "<b>How to use LiPy OCR</b>\n\n"
    "<b>Recognising characters</b>\n"
    "Send me an image of a single Odia character and I will identify it.\n\n"
    "<b>Drawing tips</b>\n"
    "\u2022 Use the canvas I provide\n"
    "\u2022 Draw one character at a time\n"
    "\u2022 Use thick strokes for better contrast\n\n"
    "<b>Image tips</b>\n"
    "\u2022 Crop to show a single character\n"
    "\u2022 Ensure good lighting and contrast\n"
    "\u2022 Avoid blurry images\n"
    "\u2022 Supported formats: PNG, JPEG, BMP, WebP\n\n"
    "<b>Commands</b>\n"
    "/start \u2014 Start and get a canvas\n"
    "/help \u2014 This help text\n"
    "/about \u2014 About the project\n"
    "/characters \u2014 Browse supported characters\n"
    "/grapheme \u2014 Look up a character\n"
    "/contribute \u2014 Donate handwriting samples\n"
    "/stats \u2014 Model statistics\n"
    "/version \u2014 Version info"
)

ABOUT_TEXT = (
    "<b>About LiPy</b>\n\n"
    "LiPy is an open-source Odia handwriting recognition project."
)

ABOUT_PROJECT = (
    "<b>Project</b>\n\n"
    "LiPy is an academic project for Odia handwritten character recognition "
    "using deep learning.\n\n"
    "It was developed during the NIELIT Bhubaneswar Internship Programme "
    "by 2nd Year students of the 5-Year Integrated MCA Programme at "
    "Utkal University.\n\n"
    "<b>Pipeline</b>\n"
    "1. User sends a character image\n"
    "2. Image is preprocessed to grayscale\n"
    "3. EfficientNetB0 classifies it\n"
    "4. Prediction and confidence returned"
)

ABOUT_TECHNOLOGY = (
    "<b>Technology</b>\n\n"
    "\u2022 Model: EfficientNetB0 (transfer learning)\n"
    "\u2022 Input: 64x64 grayscale images\n"
    "\u2022 Backend: FastAPI on Azure\n"
    "\u2022 Frontend: Next.js on Vercel\n"
    "\u2022 Bot: Python + python-telegram-bot\n\n"
    "Website: https://lipy.app\n"
    "GitHub: https://github.com/biranchikulesika/lipy"
)

ABOUT_DATASET = (
    "<b>Dataset</b>\n\n"
    "The dataset is crowdsourced through the LiPyD platform.\n\n"
    "\u2022 2,000+ handwritten samples\n"
    "\u2022 55 Odia character classes\n"
    "\u2022 Contributions welcome\n\n"
    "https://lipy.app/lipyd"
)

ABOUT_TEAM = (
    "<b>Team</b>\n\n"
    "<b>Gundala Anushka</b> \u2014 Project Lead\n"
    "Project coordination, mentor communication, presentations.\n\n"
    "<b>Biranchi Kulesika</b> \u2014 Technical Lead\n"
    "LiPyD platform, model training, OCR app, system architecture.\n\n"
    "<b>Baibhab Sahu</b> \u2014 Dataset & Documentation\n"
    "Dataset verification, sample review, data filtering.\n\n"
    "<b>Soumyasmita Mohapatra</b> \u2014 Dataset & Documentation\n"
    "Documentation, validation, quality checking.\n\n"
    "<b>Prajna Dash</b> \u2014 Dataset & Documentation\n"
    "Dataset review, sample verification, documentation."
)

CONTRIBUTE_TEXT = (
    "<b>Contribute Handwriting Samples</b>\n\n"
    "Help improve LiPy's accuracy by donating your Odia handwriting!\n\n"
    "<b>How it works</b>\n"
    "1. Open the LiPyD platform in your browser\n"
    "2. Enter your name (or a pseudonym)\n"
    "3. Draw Odia characters on the canvas\n"
    "4. Your samples help train better models\n\n"
    "<b>Tips</b>\n"
    "\u2022 Centre the character\n"
    "\u2022 Use clean backgrounds\n"
    "\u2022 Write at a comfortable size\n\n"
    "Dataset: 2,000+ samples and growing.\n\n"
    "https://lipy.app/lipyd"
)

STATS_TEXT = (
    "<b>Model Statistics</b>\n\n"
    "\u2022 <b>55</b> Odia character classes (34 consonants + 11 vowels + 10 digits)\n"
    "\u2022 <b>2,000+</b> crowdsourced handwriting samples\n"
    "\u2022 <b>EfficientNetB0</b> architecture\n"
    "\u2022 Trained on 64x64 grayscale images\n\n"
    "<b>Confidence thresholds</b>\n"
    "\u2022 Success: above 60%\n"
    "\u2022 Ambiguous: margin less than 10%\n"
    "\u2022 Low confidence: below 60%"
)

VERSION_TEXT = (
    "<b>Version Info</b>\n\n"
    "Bot: {bot}\n"
    "Model: {model}\n"
    "API: {api}\n"
    "Dataset: {dataset}"
)

CHARS_VOWELS_TEXT = (
    "<b>Vowels</b>\n\n"
    + "\n".join(f"  <code>{c.char}</code>  {c.name}  {c.unicode}" for c in odia.VOWELS)
)

CHARS_CONSONANTS_TEXT = (
    "<b>Consonants</b>\n\n"
    + "\n".join(f"  <code>{c.char}</code>  {c.name}  {c.unicode}" for c in odia.CONSONANTS)
)

CHARS_DIGITS_TEXT = (
    "<b>Digits</b>\n\n"
    + "\n".join(f"  <code>{c.char}</code>  {c.name}  {c.unicode}" for c in odia.DIGITS)
)

GRAPHAME_USAGE = (
    "Usage: /grapheme &lt;character&gt;\n\n"
    "Examples:\n"
    "/grapheme \\u0B15\n"
    "/grapheme \\u200b\\u0B15\n\n"
    "Or send a single Odia character directly."
)

UNSUPPORTED_FILE_TEXT = (
    "I can only recognise Odia characters from <b>images</b>.\n\n"
    "Please send a photo or an image file (PNG, JPEG, BMP, WebP)."
)

UNSUPPORTED_TYPE_TEXT = (
    "This message type is not supported.\n\n"
    "Please send a photo or an image file of an Odia character."
)

VIDEO_NOT_SUPPORTED_TEXT = (
    "Videos are not supported.\n\n"
    "Please send a photo or an image file instead."
)

NOT_SINGLE_CHAR_TEXT = (
    "I can only look up <b>single</b> characters.\n\n"
    "Send one Odia character at a time, or use /grapheme with a character."
)

UNSUPPORTED_ODIA_CHAR_TEXT = (
    "The character <b>{char}</b> is a valid Odia character "
    "but is <b>not supported</b> by the model.\n\n"
    "The model currently supports <b>55</b> Odia characters "
    "(34 consonants + 11 vowels + 10 digits).\n\n"
    "Send /characters to see the full list."
)

_ODIA_RANGE = (0x0B05, 0x0B3F)
_ODIA_RANGE_2 = (0x0B5F, 0x0B6F)

_EMOJI_RANGES = (
    (0x2600, 0x27BF),
    (0xFE00, 0xFE0F),
    (0x200D, 0x200D),
    (0x20E3, 0x20E3),
    (0x1F600, 0x1F64F),
    (0x1F300, 0x1F5FF),
    (0x1F680, 0x1F6FF),
    (0x1F900, 0x1F9FF),
    (0x1FA00, 0x1FA6F),
    (0x1FA70, 0x1FAFF),
    (0x1F1E0, 0x1F1FF),
    (0x2300, 0x23FF),
    (0x2B50, 0x2B55),
    (0x3030, 0x3030),
    (0x303D, 0x303D),
    (0x3297, 0x3297),
    (0x3299, 0x3299),
)


# ── Helpers ────────────────────────────────────────────────────────────────

def _is_odia_char(text: str) -> bool:
    if len(text) != 1:
        return False
    cp = ord(text)
    return (_ODIA_RANGE[0] <= cp <= _ODIA_RANGE[1]) or (_ODIA_RANGE_2[0] <= cp <= _ODIA_RANGE_2[1])


def _is_odia_codepoint(cp: int) -> bool:
    return (_ODIA_RANGE[0] <= cp <= _ODIA_RANGE[1]) or (_ODIA_RANGE_2[0] <= cp <= _ODIA_RANGE_2[1])


def _is_emoji(text: str) -> bool:
    if len(text) != 1:
        return False
    cp = ord(text)
    for lo, hi in _EMOJI_RANGES:
        if lo <= cp <= hi:
            return True
    return False


def _parse_codepoint(text: str) -> str | None:
    s = text.strip()
    for prefix in ("U+", "u+", "0x", "0X", "\\u", "\\U"):
        if s.startswith(prefix):
            hex_str = s[len(prefix):]
            try:
                cp = int(hex_str, 16)
                return chr(cp)
            except (ValueError, OverflowError):
                return None
    try:
        cp = int(s, 16)
        if _is_odia_codepoint(cp):
            return chr(cp)
    except (ValueError, OverflowError):
        pass
    return None


def _escape_html(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _is_private_chat(update: Update) -> bool:
    chat = update.effective_chat
    return chat is not None and chat.type == "private"


def _format_char_info(char: odia.OdiaCharacter) -> str:
    return (
        f"<pre>     {char.char}     </pre>\n\n"
        f"<b>Name:</b> {char.name}\n"
        f"<b>Unicode:</b> {char.unicode}\n"
        f"<b>Category:</b> {char.type.capitalize()}\n"
        f"<b>Model support:</b> Yes"
    )


def _format_predictions(preds: list, limit: int = 3) -> str:
    if not preds:
        return "  (none)"
    lines = []
    for pred in preds[:limit]:
        char_info = odia.lookup(pred.label) if pred.label else None
        if char_info:
            char_display = char_info.char
        else:
            char_display = pred.character or pred.label or "?"
        pct = f"{pred.confidence * 100:.1f}%"
        lines.append(f"  <code>{_escape_html(char_display)}</code> {pct}")
    return "\n".join(lines)


# ── Keyboards ──────────────────────────────────────────────────────────────

def _kb(*rows: list[InlineKeyboardButton]) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([list(row) for row in rows])


def _new_canvas_kb() -> InlineKeyboardMarkup:
    return _kb([InlineKeyboardButton("New Canvas", callback_data="new_canvas")])


def _about_kb() -> InlineKeyboardMarkup:
    return _kb(
        [InlineKeyboardButton("Project", callback_data="about_project"),
         InlineKeyboardButton("Technology", callback_data="about_tech")],
        [InlineKeyboardButton("Dataset", callback_data="about_dataset"),
         InlineKeyboardButton("Team", callback_data="about_team")],
        [InlineKeyboardButton("New Canvas", callback_data="new_canvas")],
    )


def _characters_kb() -> InlineKeyboardMarkup:
    return _kb(
        [InlineKeyboardButton("Vowels", callback_data="chars_vowels"),
         InlineKeyboardButton("Consonants", callback_data="chars_consonants")],
        [InlineKeyboardButton("Digits", callback_data="chars_digits"),
         InlineKeyboardButton("New Canvas", callback_data="new_canvas")],
    )


# ── Canvas ─────────────────────────────────────────────────────────────────

_CANVAS_BYTES: bytes | None = None


def _get_canvas_bytes() -> bytes:
    global _CANVAS_BYTES
    if _CANVAS_BYTES is None:
        white = Image.new("RGB", (512, 512), (255, 255, 255))
        buf = io.BytesIO()
        white.save(buf, format="PNG")
        _CANVAS_BYTES = buf.getvalue()
    return _CANVAS_BYTES


async def _send_canvas(message: Message, caption: str = CANVAS_CAPTION) -> Message | None:
    buf = io.BytesIO(_get_canvas_bytes())
    try:
        return await message.reply_photo(photo=buf, caption=caption)
    except TelegramError as exc:
        logger.error("Failed to send canvas: %s", exc)
        return None


# ── Safe send helpers ──────────────────────────────────────────────────────

async def _safe_reply(message: Message, text: str, **kwargs) -> Message | None:
    try:
        return await message.reply_text(text, **kwargs)
    except TelegramError as exc:
        logger.error("Failed to send reply: %s", exc)
        return None


async def _safe_edit(message: Message, text: str, **kwargs) -> None:
    try:
        await message.edit_text(text, **kwargs)
    except TelegramError as exc:
        logger.error("Failed to edit message: %s", exc)


async def _reply_with_kb(message: Message, text: str, kb: InlineKeyboardMarkup) -> None:
    try:
        await message.reply_text(text, parse_mode="HTML", reply_markup=kb)
    except TelegramError as exc:
        logger.error("Failed to send reply: %s", exc)


# ── Command handlers ───────────────────────────────────────────────────────

async def _warmup_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Fires API warm-up in the background on every user message."""
    asyncio.create_task(warmup_api())


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = update.effective_message
    if not msg:
        return
    user_id = update.effective_user.id if update.effective_user else "unknown"
    logger.info("User %s triggered /start", user_id)
    try:
        await msg.reply_text(WELCOME_TEXT, parse_mode="HTML")
    except TelegramError as exc:
        logger.error("Failed to send /start reply: %s", exc)
    await _send_canvas(msg)


async def help_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return
    await _reply_with_kb(update.effective_message, HELP_TEXT, _new_canvas_kb())


async def about_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return
    await _reply_with_kb(update.effective_message, ABOUT_TEXT, _about_kb())


async def characters_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return
    text = "<b>Recognised Characters</b>\n\n<b>55</b> supported characters"
    await _reply_with_kb(update.effective_message, text, _characters_kb())


async def grapheme_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = update.effective_message
    if not msg:
        return
    args = context.args
    if not args:
        await _reply_with_kb(msg, GRAPHAME_USAGE, _new_canvas_kb())
        return

    query = args[0]
    char = odia.lookup(query)
    if not char:
        await _reply_with_kb(
            msg,
            "Character not found.\n\nTry /grapheme \\u0B15 or send a single Odia character.",
            _new_canvas_kb(),
        )
        return

    await _reply_with_kb(msg, _format_char_info(char), _new_canvas_kb())


async def contribute_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return
    kb = _kb(
        [InlineKeyboardButton("Open LiPyD", url="https://lipy.app/lipyd")],
        [InlineKeyboardButton("New Canvas", callback_data="new_canvas")],
    )
    await _reply_with_kb(update.effective_message, CONTRIBUTE_TEXT, kb)


async def stats_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return
    await _reply_with_kb(update.effective_message, STATS_TEXT, _new_canvas_kb())


async def version_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.effective_message:
        return
    text = VERSION_TEXT.format(
        bot=BOT_VERSION, model=MODEL_VERSION, api=API_VERSION, dataset=DATASET_VERSION
    )
    await _reply_with_kb(update.effective_message, text, _new_canvas_kb())


# ── Callback query handler ─────────────────────────────────────────────────

async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    asyncio.create_task(warmup_api())
    query = update.callback_query
    if not query or not query.data:
        return
    await query.answer()
    data = query.data
    msg = query.message
    if not msg:
        return
    if not _is_private_chat(update):
        return

    if data == "new_canvas":
        await _send_canvas(msg)
        return

    _ABOUT = {
        "about_project": ABOUT_PROJECT,
        "about_tech": ABOUT_TECHNOLOGY,
        "about_dataset": ABOUT_DATASET,
        "about_team": ABOUT_TEAM,
    }
    if data in _ABOUT:
        await _reply_with_kb(msg, _ABOUT[data], _about_kb())
        return

    _CHARS = {
        "chars_vowels": CHARS_VOWELS_TEXT,
        "chars_consonants": CHARS_CONSONANTS_TEXT,
        "chars_digits": CHARS_DIGITS_TEXT,
    }
    if data in _CHARS:
        await _reply_with_kb(msg, _CHARS[data], _characters_kb())
        return


# ── OCR handlers ───────────────────────────────────────────────────────────

async def photo_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return

    user_id = update.effective_user.id if update.effective_user else "unknown"
    logger.info("User %s sent an image", user_id)

    status_message = await _safe_reply(message, "Processing your image.")
    if not status_message:
        return

    start = time.perf_counter()

    try:
        image_bytes, filename, content_type = await _download_image(message)
    except Exception:
        logger.exception("Failed to download image from user %s", user_id)
        await _safe_edit(status_message, "Failed to download the image. Please try again.", reply_markup=_new_canvas_kb())
        return

    try:
        image_bytes = _preprocess_image(image_bytes, filename)
    except Exception:
        logger.exception("Failed to preprocess image from user %s", user_id)
        await _safe_edit(status_message, "Failed to process the image. Please try again.", reply_markup=_new_canvas_kb())
        return

    try:
        result = await predict(image_bytes, filename, content_type)
    except APIUnavailableError as exc:
        await _safe_edit(status_message, _escape_html(str(exc)), reply_markup=_new_canvas_kb())
        return
    except InvalidImageError as exc:
        await _safe_edit(status_message, f"Could not process the image: {_escape_html(str(exc))}", reply_markup=_new_canvas_kb())
        return
    except UnexpectedResponseError as exc:
        await _safe_edit(status_message, _escape_html(str(exc)), reply_markup=_new_canvas_kb())
        return

    elapsed = time.perf_counter() - start
    logger.info("Prediction for user %s completed in %.2fs", user_id, elapsed)

    reply, keyboard = _format_result(result)
    await _safe_edit(status_message, reply, parse_mode="HTML", reply_markup=keyboard)


async def document_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message or not message.document:
        return

    if not message.document.mime_type or not message.document.mime_type.startswith("image/"):
        try:
            await message.reply_text(
                "Please send an image file. Only image uploads are supported.",
                reply_markup=_new_canvas_kb(),
            )
        except TelegramError as exc:
            logger.error("Failed to send non-image reply: %s", exc)
        return

    await photo_handler(update, context)


async def text_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message or not message.text:
        return
    if message.text.startswith("/"):
        return

    text = message.text.strip()

    if len(text) == 1:
        if _is_odia_char(text):
            char = odia.lookup(text)
            if char:
                await _reply_with_kb(message, _format_char_info(char), _new_canvas_kb())
            else:
                await _reply_with_kb(
                    message,
                    UNSUPPORTED_ODIA_CHAR_TEXT.format(char=_escape_html(text)),
                    _new_canvas_kb(),
                )
            return

        if _is_emoji(text):
            await _reply_with_kb(message, UNSUPPORTED_FILE_TEXT, _new_canvas_kb())
            return

        await _reply_with_kb(message, UNSUPPORTED_FILE_TEXT, _new_canvas_kb())
        return

    char = _parse_codepoint(text)
    if char:
        if _is_odia_char(char):
            odia_char = odia.lookup(char)
            if odia_char:
                await _reply_with_kb(message, _format_char_info(odia_char), _new_canvas_kb())
            else:
                await _reply_with_kb(
                    message,
                    UNSUPPORTED_ODIA_CHAR_TEXT.format(char=_escape_html(char)),
                    _new_canvas_kb(),
                )
        else:
            await _reply_with_kb(
                message,
                f"The character <b>{_escape_html(char)}</b> is not an Odia character.",
                _new_canvas_kb(),
            )
        return

    await _reply_with_kb(message, NOT_SINGLE_CHAR_TEXT, _new_canvas_kb())


async def sticker_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_FILE_TEXT, _new_canvas_kb())


async def animation_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_FILE_TEXT, _new_canvas_kb())


async def video_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, VIDEO_NOT_SUPPORTED_TEXT, _new_canvas_kb())


async def video_note_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, VIDEO_NOT_SUPPORTED_TEXT, _new_canvas_kb())


async def voice_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_FILE_TEXT, _new_canvas_kb())


async def audio_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_FILE_TEXT, _new_canvas_kb())


async def location_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_TYPE_TEXT, _new_canvas_kb())


async def contact_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_TYPE_TEXT, _new_canvas_kb())


async def poll_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_TYPE_TEXT, _new_canvas_kb())


async def dice_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_TYPE_TEXT, _new_canvas_kb())


async def invoice_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    if not message:
        return
    await _reply_with_kb(message, UNSUPPORTED_TYPE_TEXT, _new_canvas_kb())


# ── Image download and preprocessing ───────────────────────────────────────

async def _download_image(message: Message) -> tuple[bytes, str, str]:
    if message.photo:
        photo = message.photo[-1]
        if photo.file_size and photo.file_size > config.max_image_size_bytes:
            raise ValueError(
                f"Image too large ({photo.file_size // 1024 // 1024}MB). "
                f"Maximum allowed is {config.max_image_size_mb:.0f}MB."
            )
        file_id = photo.file_id
        file_name = f"image_{file_id}.jpg"
        mime_type = "image/jpeg"
    elif message.document and message.document.mime_type and message.document.mime_type.startswith("image/"):
        if message.document.file_size and message.document.file_size > config.max_image_size_bytes:
            size_mb = message.document.file_size / 1024 / 1024
            raise ValueError(
                f"Image too large ({size_mb:.1f}MB). "
                f"Maximum allowed is {config.max_image_size_mb:.0f}MB."
            )
        file_id = message.document.file_id
        file_name = message.document.file_name or f"image_{file_id}"
        mime_type = message.document.mime_type
    else:
        raise ValueError("No downloadable image found in message.")

    bot = message.get_bot()
    if not bot:
        raise ValueError("Bot instance not available.")

    telegram_file = await bot.get_file(file_id)
    image_data = await telegram_file.download_as_bytearray()

    return bytes(image_data), file_name, mime_type


def _preprocess_image(image_bytes: bytes, filename: str) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("L")

    hist = img.histogram()
    total = sum(hist)
    sum_total = sum(i * hist[i] for i in range(256))
    sum_bg = 0.0
    weight_bg = 0
    best_var = 0.0
    threshold = 128

    for i in range(256):
        weight_bg += hist[i]
        if weight_bg == 0:
            continue
        weight_fg = total - weight_bg
        if weight_fg == 0:
            break
        sum_bg += i * hist[i]
        mean_bg = sum_bg / weight_bg
        mean_fg = (sum_total - sum_bg) / weight_fg
        variance = weight_bg * weight_fg * (mean_bg - mean_fg) ** 2
        if variance > best_var:
            best_var = variance
            threshold = i

    table = bytes(255 if i >= threshold else 0 for i in range(256))
    img = img.point(table, "1")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ── Result formatting ──────────────────────────────────────────────────────

def _format_result(result: PredictionResult) -> tuple[str, InlineKeyboardMarkup]:
    if result.status == "success":
        return _format_success(result)
    if result.status == "low_confidence":
        return _format_low_confidence(result)
    if result.status == "ambiguous":
        return _format_ambiguous(result)
    return "Received an unexpected result from the OCR service.", _new_canvas_kb()


def _format_success(result: PredictionResult) -> tuple[str, InlineKeyboardMarkup]:
    confidence_pct = f"{result.confidence * 100:.2f}%"

    char_info = odia.lookup(result.prediction) if result.prediction else None

    if char_info:
        char_display = char_info.char
    else:
        char_display = result.character or result.prediction or "?"

    lines = [
        f"<pre>     {_escape_html(char_display)}     </pre>",
        "",
    ]

    if char_info:
        lines.extend([
            f"<b>Name:</b> {result.prediction or char_info.name}",
            f"<b>Unicode:</b> {char_info.unicode}",
            f"<b>Category:</b> {char_info.type.capitalize()}",
            f"<b>Confidence:</b> {confidence_pct}",
        ])
    else:
        lines.extend([
            f"<b>Confidence:</b> {confidence_pct}",
        ])

    return "\n".join(lines), _new_canvas_kb()


def _format_low_confidence(result: PredictionResult) -> tuple[str, InlineKeyboardMarkup]:
    lines = [
        "<b>I couldn't identify this character confidently.</b>",
        "",
        "<b>Most likely:</b>",
        _format_predictions(result.top_predictions),
        "",
        "<b>Tips:</b>",
        "\u2022 Crop to one character.",
        "\u2022 Improve lighting.",
        "\u2022 Avoid blurry images.",
        "\u2022 Increase contrast.",
    ]
    return "\n".join(lines), _new_canvas_kb()


def _format_ambiguous(result: PredictionResult) -> tuple[str, InlineKeyboardMarkup]:
    lines = [
        "<b>This image appears to contain multiple characters.</b>",
        "",
        "Please crop the image so that only one character is visible.",
        "",
        "<b>Top guesses:</b>",
        _format_predictions(result.top_predictions),
    ]
    return "\n".join(lines), _new_canvas_kb()
