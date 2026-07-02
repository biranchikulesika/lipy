# LiPy Frontend

The frontend for the LiPy Odia OCR project is a modern, responsive web application built using **Next.js (App Router)** and **React**.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## Architecture

The frontend is modularized into feature-based workspaces:

- `components/ocr/`: Contains the OCR Workspace, handling character recognition.
  - Features multiple input modes (Camera, Drawing, Upload) via modular tabs.
  - Sends image data to the FastAPI backend for real-time predictions.
  - Displays beautiful, elastic prediction result cards displaying confidence metrics.
- `components/lipyd/`: The Data Contributor Workspace, allowing users to draw and build robust character datasets directly from the browser.
- `components/about/` and `components/team/`: Informational pages describing the mission and contributors behind the project.

## Important Hooks

- `useCanvasDrawing.ts`: A robust custom hook managing drawing states, brush logic, clearing, and canvas initialization for both the OCR module and the Dataset Contributor module.
- `useDatasetSync.ts`: Controls the data payload state for user-generated Odia character contributions.

## Local Development

Ensure you have Node.js installed, then start the frontend:

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open `http://localhost:3000` to view the application.

## Environment Variables

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_API_URL` | The URL of the deployed FastAPI backend (e.g., `https://api.lipy.app`). Ensure this is set for Next.js to successfully ping the `POST /predict` endpoint. |
