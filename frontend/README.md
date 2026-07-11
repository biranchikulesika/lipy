# LiPy Frontend

The frontend for the LiPy Odia OCR project is a modern, responsive web application built using **Next.js (App Router)** and **React**.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript 6
- **Animations**: Motion
- **Deployment**: Vercel
- **Database**: Supabase / Dexie (IndexedDB)

## Architecture

The frontend is modularized into feature-based workspaces:

- **`components/ocr/`**: OCR Workspace for character recognition.
  - Features multiple input modes (Camera, Drawing, Upload) via modular tabs.
  - Sends image data to the FastAPI backend for real-time predictions.
  - Displays elastic prediction result cards with confidence metrics.
- **`components/lipyd/`**: Data Contributor Workspace (LiPyD), allowing users to draw and build character datasets directly from the browser.
- **`components/about/`** and **`components/team/`**: Informational pages describing the mission and contributors.
- **`components/navigation/`**: Responsive navbar with mobile support and legal links.
- **`components/admin/`**: Admin dashboard shell and settings.

## Important Hooks

- **`useCanvasDrawing.ts`**: Manages canvas drawing states, brush logic, clearing, and initialization for both OCR and Dataset Contributor modules.
- **`useCharacterSelection.ts`**: Controls the character selection and navigation flow in the LiPyD contributor workspace.
- **`useDatasetSync.ts`**: Manages data payload state and synchronization for user-generated Odia character contributions via IndexedDB, cookies, and localStorage.

## Admin Dashboard

The admin dashboard (`/admin`) provides role-based access to manage the dataset, verify contributions, and configure security settings.

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

### Authentication & Security

- **Passkey support** — Passwordless WebAuthn login.
- **Email/password login** — Standard credentials with optional Google/GitHub OAuth.
- **Forgot password** / **Reset password** flows.
- **Session revocation** — Administrators can revoke active sessions.
- **Security activity logging** — 12 event types tracked (login, logout, failed login, passkey registration, session revocation, etc.) with IP, browser, OS, and device metadata.
- **Rate limiting** and **CSP headers** enforced via Next.js middleware proxy.

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
