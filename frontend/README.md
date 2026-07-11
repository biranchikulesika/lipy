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

## Admin Dashboard

The admin dashboard (`/admin`) provides role-based access to manage the dataset and verify contributions.

### Admin Roles

Users must be added to the `admins` table in Supabase to access the dashboard. Roles follow a hierarchy where higher roles inherit all permissions of lower roles.

| Role | View Dashboard | Verify/Unverify Samples | Delete Samples |
| ---- | :------------: | :---------------------: | :------------: |
| `viewer` | Yes | No | No |
| `verifier` | Yes | Yes | No |
| `admin` | Yes | Yes | Yes |
| `owner` | Yes | Yes | Yes |

- **viewer** — Read-only access to the dataset viewer and dashboard stats.
- **verifier** — Can verify and unverify dataset samples (sets `verified_by` and `verified_at` audit fields).
- **admin** — Can verify samples and delete rejected samples from the dataset.
- **owner** — Full access. Same as admin, reserved for the primary administrator.

### Database Schema

The Supabase SQL schema script is located at `scripts/database/schema.sql`. It creates all tables (`lipy_contributors`, `lipy_sessions`, `lipy_samples`, `security_events`, `admins`), RLS policies, storage buckets, and helper functions. Safe to run multiple times.

To apply: open the **Supabase Dashboard → SQL Editor**, paste the script, and execute.

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
