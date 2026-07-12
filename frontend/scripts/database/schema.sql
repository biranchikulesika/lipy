-- ============================================================================
-- LiPy Database Schema
-- Target: Supabase PostgreSQL
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================================

-- ─── Extensions ───

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Admins ───

CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'verifier', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── lipy_contributors ───

CREATE TABLE IF NOT EXISTS lipy_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id TEXT NOT NULL,
  contributor_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- ── Verification & anti-abuse columns ──
  invalid_streak INTEGER DEFAULT 0,
  banned_until TIMESTAMPTZ,
  trust_score INTEGER DEFAULT 0,
  total_verified INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  last_invalid_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS lipi_contributors_contributor_id_key
  ON lipy_contributors (contributor_id);

CREATE INDEX IF NOT EXISTS idx_lipy_contributors_last_seen
  ON lipy_contributors (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_lipy_contributors_banned_until
  ON lipy_contributors (banned_until);

CREATE INDEX IF NOT EXISTS idx_lipy_contributors_invalid_streak
  ON lipy_contributors (invalid_streak);

-- ─── lipy_sessions ───

CREATE TABLE IF NOT EXISTS lipy_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE UNIQUE INDEX IF NOT EXISTS lipi_sessions_contributor_id_session_id_key
  ON lipy_sessions (contributor_id, session_id);

CREATE INDEX IF NOT EXISTS idx_lipy_sessions_updated_at
  ON lipy_sessions (updated_at DESC);

-- ─── lipy_samples ───

CREATE TABLE IF NOT EXISTS lipy_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_sample_id TEXT NOT NULL,
  contributor_id TEXT NOT NULL,
  contributor_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  character_id TEXT NOT NULL,
  character_text TEXT NOT NULL,
  sample_number INTEGER NOT NULL,
  filename TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'lipi-samples',
  storage_path TEXT NOT NULL,
  blob_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  upload_status TEXT NOT NULL DEFAULT 'uploaded',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR DEFAULT 'unverified',
  -- verified_by: use '00000000-0000-0000-0000-000000000000' for auto-verification service;
  --                   admin UUID for manual verification; null for unverified samples
  verified_by UUID,
  verified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS lipi_samples_client_sample_id_key
  ON lipy_samples (client_sample_id);

CREATE UNIQUE INDEX IF NOT EXISTS lipi_samples_storage_path_key
  ON lipy_samples (storage_path);

CREATE INDEX IF NOT EXISTS idx_lipy_samples_contributor_id
  ON lipy_samples (contributor_id);

CREATE INDEX IF NOT EXISTS idx_lipy_samples_session_id
  ON lipy_samples (session_id);

CREATE INDEX IF NOT EXISTS idx_lipy_samples_character_id
  ON lipy_samples (character_id);

CREATE INDEX IF NOT EXISTS idx_lipy_samples_status
  ON lipy_samples (status);

CREATE INDEX IF NOT EXISTS idx_lipy_samples_upload_status
  ON lipy_samples (upload_status);

CREATE INDEX IF NOT EXISTS idx_lipy_samples_created_at
  ON lipy_samples (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lipy_samples_verified_by
  ON lipy_samples (verified_by);

CREATE INDEX IF NOT EXISTS lipi_samples_contributor_session_idx
  ON lipy_samples (contributor_id, session_id);

CREATE INDEX IF NOT EXISTS lipi_samples_uploaded_at_idx
  ON lipy_samples (uploaded_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS lipi_samples_character_idx
  ON lipy_samples (character_id);

-- ─── verification_logs ───

CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  contributor_id TEXT NOT NULL,
  expected_character TEXT NOT NULL,
  predicted_character TEXT,
  confidence DOUBLE PRECISION,
  accepted BOOLEAN NOT NULL,
  invalid_streak_after_request INTEGER NOT NULL DEFAULT 0,
  temporary_ban_applied BOOLEAN NOT NULL DEFAULT false,
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  stage TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_created_at
  ON verification_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_logs_contributor_id
  ON verification_logs (contributor_id);

CREATE INDEX IF NOT EXISTS idx_verification_logs_accepted
  ON verification_logs (accepted);

-- ─── security_events ───

CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  device_info TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location TEXT,
  session_id TEXT,
  is_active BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id
  ON security_events (user_id);

CREATE INDEX IF NOT EXISTS idx_security_events_event_type
  ON security_events (event_type);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at
  ON security_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_is_active
  ON security_events (is_active) WHERE is_active = true;

-- ─── Storage bucket ───
-- Run this separately in the Supabase dashboard if needed:
--   Storage → Create bucket → "lipy-samples" (public or private as desired)
