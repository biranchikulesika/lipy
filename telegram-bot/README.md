# LiPy Telegram Bot

A Telegram bot that recognises handwritten and printed Odia characters from images using deep learning. The bot bridges Telegram users to the [LiPy OCR API](https://github.com/biranchikulesika/lipy) — it performs no OCR locally.

## Architecture

```
Telegram User
    |
    v
Telegram Bot (polling or webhook)
    |
    v
LiPy OCR API (Azure Container Apps)
    |
    v
EfficientNetB0 Model
    |
    v
Prediction + Confidence --> Reply to User
```

The bot runs in one of two modes:

- **Polling mode** — for local development (`python bot.py`)
- **Webhook mode** — for production deployment on Vercel (`api/index.py`)

Both modes share the same handler logic in `handlers.py`.

## Project Structure

```
.
├── bot.py                  # Entry point for polling mode (local development)
├── handlers.py             # All Telegram handlers: commands, callbacks, OCR, text
├── api_client.py           # Async HTTP client for the LiPy OCR API
├── config.py               # Configuration loaded from environment variables
├── odia.py                 # Odia character database (55 characters)
├── warmup.py               # API warm-up to reduce Azure cold-start latency
├── assets/
│   └── warmup.png          # 64x64 white image with କ for container warm-up
├── api/
│   └── index.py            # Vercel serverless webhook endpoint
├── botfather_commands.txt  # BotFather command definitions
├── requirements.txt        # Python dependencies
├── .env.example            # Template for environment variables
├── .gitignore
├── .dockerignore
├── vercel.json             # Vercel routing and function configuration
├── Dockerfile              # Docker image for self-hosted deployment
└── README.md
```

## Prerequisites

- Python 3.12 or later
- A Telegram bot token (see [BotFather](#register-the-bot-with-botfather) below)
- Access to a running LiPy OCR API instance

## Setup

### 1. Register the Bot with BotFather

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Send `/newbot`.
3. Choose a display name (e.g., `LiPy OCR Bot`).
4. Choose a username ending in `bot` (e.g., `lipy_ocr_bot`).
5. Copy the API token BotFather sends you.

### 2. Install Dependencies

```bash
cd lipy-telegram-bot
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
TELEGRAM_BOT_TOKEN=your_token_from_botfather
LIPY_API_URL=https://api.lipy.app
```

### 4. Run Locally (Polling)

```bash
python bot.py
```

The bot starts in long-polling mode. Open Telegram, find your bot, and send it a photo of an Odia character.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | — | Bot token from BotFather |
| `LIPY_API_URL` | No | `https://api.lipy.app` | Base URL of the LiPy OCR API |
| `API_TIMEOUT` | No | `30` | HTTP timeout in seconds for OCR requests |
| `WEBHOOK_SECRET` | No | — | Secret token for webhook request verification |
| `LOG_LEVEL` | No | `INFO` | Python logging level |
| `MAX_IMAGE_SIZE_MB` | No | `10` | Maximum allowed image size in megabytes |

## Bot Commands

| Command | Description |
|---|---|
| `/start` | Welcome message and a blank drawing canvas |
| `/help` | Usage instructions, drawing tips, and image tips |
| `/about` | About the LiPy project (sub-menu with Project, Technology, Dataset, Team) |
| `/characters` | Browse all 55 supported Odia characters (Vowels, Consonants, and Digits) |
| `/grapheme` | Look up a specific character by its unicode, id, or name |
| `/contribute` | Links to the LiPyD platform to donate handwriting samples |
| `/stats` | Model statistics (classes, samples, architecture, confidence thresholds) |
| `/version` | Bot, model, API, and dataset version information |

### BotFather Command Descriptions

These are the descriptions registered with BotFather (stored in `botfather_commands.txt`):

```
start - Start the bot and receive a drawing canvas
help - Learn how to use LiPy OCR
about - About the LiPy project
characters - Browse supported Odia characters
grapheme - Look up an Odia character
contribute - Contribute handwriting samples
stats - View model statistics
version - View bot and model versions
```

## Usage

### Recognising Characters from Images

1. Send a **photo** or **image file** (PNG, JPEG, BMP, WebP) to the bot.
2. The bot preprocesses the image to grayscale using Otsu's thresholding.
3. The preprocessed image is sent to the LiPy OCR API.
4. You receive the recognised Odia character with its name, unicode, category, and confidence score.

### Drawing on the Canvas

When you send `/start`, the bot provides a blank white canvas (512x512 PNG). You can:

1. Tap the canvas image.
2. Choose **Edit**.
3. Select the **Brush** tool.
4. Draw one Odia character.
5. Send the edited image back to the bot.

### Looking Up Characters by Text

You can send a single Odia character directly (without an image) and the bot will display its details:

- **Supported character** — shows name, unicode, type, and model support status.
- **Unsupported Odia character** — informs you that the character is valid Odia but not in the model's 55 supported classes.

You can also send a unicode codepoint in any of these formats:

- `U+0B15`
- `0x0B15`
- `\u0B15`

The bot parses the codepoint and looks up the corresponding character.

### Response Examples

**Successful prediction:**

```
┌─────────────────┐
│                 │
│        କ        │
│                 │
└─────────────────┘

Name  ka
Unicode  U+0B15
Category  Consonant
Confidence  94.50%
```

**Low confidence:**

```
I couldn't identify this character confidently.

Most likely
  ଳ  18.7%
  ୟ  15.9%
  ଞ  12.9%

Tips
• Crop to one character.
• Improve lighting.
• Avoid blurry images.
• Increase contrast.
```

**Ambiguous (multiple characters):**

```
This image appears to contain multiple characters.

Please crop the image so that only one character is visible.

Top guesses
  କ  12.3%
  ଖ  11.8%
  ଗ  10.5%
```

**Single supported character sent as text:**

```
କ

Unicode: U+0B15
Name: ka
Type: consonant
Model support: Yes
```

**Unicode codepoint lookup:**

```
U+0B15

Unicode: U+0B15
Name: ka
Type: consonant
Model support: Yes
```

## Handling of Unsupported Messages

The bot gracefully handles every type of message a user can send:

| Message Type | Bot Response |
|---|---|
| Photo | Processed through OCR |
| Image file upload (PNG, JPEG, BMP, WebP) | Processed through OCR |
| Sticker | "I can only recognise Odia characters from images." |
| GIF / Animation | "I can only recognise Odia characters from images." |
| Video | "Videos are not supported. Please send a photo or an image file instead." |
| Video note (round video) | "Videos are not supported. Please send a photo or an image file instead." |
| Voice message | "I can only recognise Odia characters from images." |
| Audio file | "I can only recognise Odia characters from images." |
| Non-image document (PDF, etc.) | "Please send an image file. Only image uploads are supported." |
| Single supported Odia character | Character info: name, unicode, type, model support |
| Single unsupported Odia character | "Valid Odia character but not supported by the model" |
| Unicode codepoint (e.g., U+0B15) | Parsed and looked up — shows info or "not an Odia character" |
| Emoji | "I can only recognise Odia characters from images." |
| Multiple characters / sentence | "I can only look up single characters." |
| Command (e.g., /help) | Handled by the respective command handler |

## Image Processing Pipeline

1. **Download** — The bot downloads the image from Telegram's servers using the file ID.
2. **Size check** — Images exceeding `MAX_IMAGE_SIZE_MB` are rejected before download.
3. **Grayscale conversion** — The image is converted to 8-bit grayscale (`L` mode).
4. **Otsu's thresholding** — An automatic threshold is computed to binarise the image (black character on white background). This handles coloured backgrounds correctly, unlike a fixed threshold.
5. **Encoding** — The binarised image is saved as PNG or JPEG and sent to the LiPy OCR API.

## OCR API Integration

The bot communicates with the LiPy OCR API via an async HTTP client (`api_client.py`).

- **Endpoint:** `POST {LIPY_API_URL}/predict`
- **Request:** Multipart form upload with the preprocessed image
- **Response:** JSON with `status`, `prediction`, `confidence`, `character`, `top_predictions`

### Prediction Statuses

| Status | Meaning |
|---|---|
| `success` | Character identified with confidence above 60% and clear margin |
| `low_confidence` | Confidence below 60% — top guesses provided |
| `ambiguous` | Margin between top two guesses less than 10% — multiple characters likely |

### API Warm-Up

Azure Container Apps with `minReplicas=0` scales down to zero after inactivity. To reduce cold-start latency, the bot fires a background warm-up request (`warmup.py`) each time a user sends `/start`. This sends a dummy 64x64 image (`assets/warmup.png`) to the API so the container is already running by the time the user submits their first real image. Warm-up failures are logged but never surface to the user.

## Supported Odia Characters

The model supports **55** Odia characters from the Unicode block U+0B00–U+0B7F.

### Vowels (11)

| Character | Name | Unicode |
|---|---|---|
| ଅ | a | U+0B05 |
| ଆ | aa | U+0B06 |
| ଇ | i | U+0B07 |
| ଈ | ii | U+0B08 |
| ଉ | u | U+0B09 |
| ଊ | uu | U+0B0A |
| ଋ | ru | U+0B0B |
| ଏ | e | U+0B0F |
| ଐ | ai | U+0B10 |
| ଓ | o | U+0B13 |
| ଔ | au | U+0B14 |

### Consonants (34)

| Character | Name | Unicode |
|---|---|---|
| କ | ka | U+0B15 |
| ଖ | kha | U+0B16 |
| ଗ | ga | U+0B17 |
| ଘ | gha | U+0B18 |
| ଙ | nga | U+0B19 |
| ଚ | ca | U+0B1A |
| ଛ | cha | U+0B1B |
| ଜ | ja | U+0B1C |
| ଝ | jha | U+0B1D |
| ଞ | nya | U+0B1E |
| ଟ | tta | U+0B1F |
| ଠ | ttha | U+0B20 |
| ଡ | dda | U+0B21 |
| ଢ | ddha | U+0B22 |
| ଣ | nna | U+0B23 |
| ତ | ta | U+0B24 |
| ଥ | tha | U+0B25 |
| ଦ | da | U+0B26 |
| ଧ | dha | U+0B27 |
| ନ | na | U+0B28 |
| ପ | pa | U+0B2A |
| ଫ | pha | U+0B2B |
| ବ | ba | U+0B2C |
| ଭ | bha | U+0B2D |
| ମ | ma | U+0B2E |
| ଯ | ya | U+0B2F |
| ର | ra | U+0B30 |
| ଲ | la | U+0B32 |
| ଳ | lla | U+0B33 |
| ଶ | sha | U+0B36 |
| ଷ | ssha | U+0B37 |
| ସ | sa | U+0B38 |
| ହ | ha | U+0B39 |
| ୟ | yya | U+0B5F |

### Digits (10)

| Character | Name | Unicode |
|---|---|---|
| ୦ | 0 | U+0B66 |
| ୧ | 1 | U+0B67 |
| ୨ | 2 | U+0B68 |
| ୩ | 3 | U+0B69 |
| ୪ | 4 | U+0B6A |
| ୫ | 5 | U+0B6B |
| ୬ | 6 | U+0B6C |
| ୭ | 7 | U+0B6D |
| ୮ | 8 | U+0B6E |
| ୯ | 9 | U+0B6F |

## Confidence Thresholds

| Threshold | Condition | Meaning |
|---|---|---|
| Success | Confidence > 60% and margin > 10% | Character identified |
| Ambiguous | Margin < 10% | Multiple characters likely |
| Low confidence | Confidence < 60% | Image quality too poor |

## Error Handling

| Scenario | User Sees |
|---|---|
| OCR API unavailable | "OCR service is currently unavailable." |
| API timeout | "OCR service is taking too long. Please try again later." |
| API returns 400 | "Could not process the image: ..." |
| API returns unexpected error | "OCR service returned an unexpected error." |
| Image too large | "Image too large (XMB). Maximum allowed is 10MB." |
| Telegram download failure | "Failed to download the image. Please try again." |
| Image preprocessing failure | "Failed to process the image. Please try again." |
| Non-image document upload | "Please send an image file. Only image uploads are supported." |
| Video upload | "Videos are not supported. Please send a photo or an image file instead." |
| Sticker / GIF / Voice / Audio | "I can only recognise Odia characters from images." |
| Emoji | "I can only recognise Odia characters from images." |
| Multiple characters as text | "I can only look up single characters." |
| Unsupported Odia character | "Valid Odia character but not supported by the model." |

## Security

- The webhook endpoint verifies the `X-Telegram-Bot-Api-Secret-Token` header when `WEBHOOK_SECRET` is set.
- The bot only responds to messages in private chats (not group chats).
- Image size is validated before downloading.
- Bot tokens and secrets are never logged.
- HTTP clients are created per-request (no shared state across serverless invocations).

## Deploy to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel --prod
```

### 3. Set Environment Variables

```bash
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add LIPY_API_URL production
vercel env add WEBHOOK_SECRET production
```

### 4. Generate a Webhook Secret

```bash
openssl rand -hex 32
```

Copy the output and use it as the `WEBHOOK_SECRET` value.

### 5. Set the Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<YOUR_VERCEL_DOMAIN>/api/webhook",
    "secret_token": "<YOUR_WEBHOOK_SECRET>",
    "allowed_updates": ["message", "edited_message", "channel_post", "callback_query"]
  }'
```

Replace:
- `<TOKEN>` with your bot token
- `<YOUR_VERCEL_DOMAIN>` with your Vercel deployment URL
- `<YOUR_WEBHOOK_SECRET>` with the secret you generated

### 6. Verify

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

The `url` field should show your Vercel webhook URL. The `secret_token_ok` field should be `true`.

### Vercel Routing

| Route | Destination |
|---|---|
| `POST /api/webhook` | `api/index.py` — Telegram webhook endpoint |
| `GET /health` | `api/index.py` — Health check endpoint |

The serverless function has a 30-second timeout (`vercel.json`).

## Deploy with Docker

```bash
docker build -t lipy-telegram-bot .
docker run \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e LIPY_API_URL=https://api.lipy.app \
  lipy-telegram-bot
```

The Dockerfile uses `python:3.12-slim`, creates a non-root user, and includes a health check.

## Handler Registration Order

The bot registers handlers in this order (first match wins):

1. Command handlers (`/start`, `/help`, `/about`, `/characters`, `/grapheme`, `/contribute`, `/stats`, `/version`)
2. Callback query handler (inline keyboard button presses)
3. Photo handler (Telegram compressed photos)
4. Document handler (image file uploads)
5. Sticker handler
6. Animation handler (GIFs)
7. Video handler
8. Video note handler (round videos)
9. Voice handler
10. Audio handler
11. Text handler (all remaining text messages)

## Version Information

| Component | Version |
|---|---|
| Bot | 2.0.0 |
| Model | 1.0.0 |
| API | 1.0.0 |
| Dataset | 1.0.0 |

## Technology Stack

- **Model:** EfficientNetB0 (transfer learning), trained on 64x64 grayscale images
- **OCR Backend:** FastAPI on Azure Container Apps
- **Website:** Next.js on Vercel — [lipy.app](https://lipy.app)
- **Bot:** Python 3.12 + python-telegram-bot 21.6
- **HTTP Client:** httpx 0.27.2 (async, per-request)
- **Image Processing:** Pillow 11.2.1
- **Dataset:** [LiPyD](https://lipy.app/lipyd) — 2,000+ crowdsourced samples, 55 classes

## Project Links

- **Website:** [lipy.app](https://lipy.app)
- **GitHub:** [github.com/biranchikulesika/lipy](https://github.com/biranchikulesika/lipy)
- **Dataset:** [lipy.app/lipyd](https://lipy.app/lipyd)
- **Bot Repository:** [github.com/biranchikulesika/lipy-telegram-bot](https://github.com/biranchikulesika/lipy-telegram-bot)

## Team

- **Gundala Anushka** — Project Lead
- **Biranchi Kulesika** — Technical Lead
- **Baibhab Sahu** — Dataset and Documentation
- **Soumyasmita Mohapatra** — Dataset and Documentation
- **Prajna Dash** — Dataset and Documentation

## License

Part of the [LiPy](https://github.com/biranchikulesika/lipy) project. See the root LICENSE for details.
