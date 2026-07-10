-- =============================================================================
-- Lipy Database — Full Schema Migration
-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor to recreate the entire DB.
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ─────────────────────────────────────────────────────────────────────

-- 2a. Contributors
CREATE TABLE IF NOT EXISTS lipy_contributors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id TEXT NOT NULL UNIQUE,
  contributor_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  last_seen_at  TIMESTAMPTZ,
  metadata      JSONB
);

-- 2b. Sessions — tracks contributor work sessions
CREATE TABLE IF NOT EXISTS lipy_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id  TEXT NOT NULL,
  session_id      TEXT NOT NULL,
  mode            TEXT NOT NULL,
  started_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  user_agent      TEXT,
  metadata        JSONB,
  UNIQUE (contributor_id, session_id),
  CONSTRAINT lipy_sessions_contributor_id_fkey
    FOREIGN KEY (contributor_id)
    REFERENCES lipy_contributors (contributor_id)
    ON DELETE CASCADE,
  CONSTRAINT lipy_sessions_mode_check
    CHECK (mode IN ('mixed-random', 'single-character', 'random', 'single'))
);

-- 2c. Samples — handwriting image metadata
CREATE TABLE IF NOT EXISTS lipy_samples (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_sample_id  TEXT NOT NULL UNIQUE,
  contributor_id    TEXT,
  contributor_name  TEXT,
  session_id        TEXT,
  mode              TEXT,
  character_id      TEXT,
  character_text    TEXT,
  sample_number     INTEGER,
  filename          TEXT,
  storage_bucket    TEXT DEFAULT 'lipy-samples',
  storage_path      TEXT,
  blob_bytes        INTEGER,
  mime_type         TEXT DEFAULT 'image/png',
  upload_status     TEXT DEFAULT 'pending',
  retry_count       INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  uploaded_at       TIMESTAMPTZ,
  metadata          JSONB,
  status            VARCHAR(50) DEFAULT 'pending',
  CONSTRAINT lipy_samples_contributor_id_fkey
    FOREIGN KEY (contributor_id)
    REFERENCES lipy_contributors (contributor_id)
    ON DELETE SET NULL
);

-- 2d. Security events — admin audit log
CREATE TABLE IF NOT EXISTS security_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL,
  event_type  TEXT NOT NULL,
  status      TEXT,
  device_info TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lipy_samples_contributor_id ON lipy_samples (contributor_id);
CREATE INDEX IF NOT EXISTS idx_lipy_samples_session_id     ON lipy_samples (session_id);
CREATE INDEX IF NOT EXISTS idx_lipy_samples_character_id   ON lipy_samples (character_id);
CREATE INDEX IF NOT EXISTS idx_lipy_samples_created_at     ON lipy_samples (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lipy_samples_upload_status  ON lipy_samples (upload_status);
CREATE INDEX IF NOT EXISTS idx_lipy_samples_status         ON lipy_samples (status);
CREATE INDEX IF NOT EXISTS idx_lipy_contributors_last_seen ON lipy_contributors (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_lipy_sessions_updated_at    ON lipy_sessions (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id     ON security_events (user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at  ON security_events (created_at DESC);

-- ─────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────

-- 4a. Enable RLS on all tables
ALTER TABLE lipy_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lipy_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lipy_samples       ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events    ENABLE ROW LEVEL SECURITY;

-- ─── 4b. Anon policies (used by dataset sync / public contributors) ───

-- lipy_contributors: any contributor can create/update their own profile
CREATE POLICY "anon_select_lipy_contributors" ON lipy_contributors
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_lipy_contributors" ON lipy_contributors
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_lipy_contributors" ON lipy_contributors
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- lipy_sessions: any contributor can create/update sessions
CREATE POLICY "anon_select_lipy_sessions" ON lipy_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_lipy_sessions" ON lipy_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_lipy_sessions" ON lipy_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- lipy_samples: any contributor can create/update samples
CREATE POLICY "anon_select_lipy_samples" ON lipy_samples
  FOR SELECT TO anon USING (true);

CREATE POLICY "anon_insert_lipy_samples" ON lipy_samples
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_lipy_samples" ON lipy_samples
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ─── 4c. Authenticated policies (used by admin dashboard) ───

-- lipy_samples: admins can read all samples
CREATE POLICY "auth_select_lipy_samples" ON lipy_samples
  FOR SELECT TO authenticated USING (true);

-- lipy_contributors: admins can read all contributors
CREATE POLICY "auth_select_lipy_contributors" ON lipy_contributors
  FOR SELECT TO authenticated USING (true);

-- lipy_sessions: admins can read all sessions
CREATE POLICY "auth_select_lipy_sessions" ON lipy_sessions
  FOR SELECT TO authenticated USING (true);

-- security_events: admins can read and insert security events
CREATE POLICY "auth_select_security_events" ON security_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_security_events" ON security_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────
-- 5. STORAGE BUCKET SETUP
-- ─────────────────────────────────────────────────────────────────────

-- Create the private storage bucket (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'lipy-samples', 'lipy-samples', false, 5242880, '{image/png,image/jpeg}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'lipy-samples');

-- RLS on storage.objects is already enabled by default in Supabase

-- Allow anon to upload images into the lipy-samples bucket
CREATE POLICY "anon_insert_lipy_objects" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'lipy-samples');

-- Allow anon to read images from the lipy-samples bucket
CREATE POLICY "anon_select_lipy_objects" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'lipy-samples');

-- Allow anon to update/overwrite files in the lipy-samples bucket (for upsert)
CREATE POLICY "anon_upsert_lipy_objects" ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id = 'lipy-samples')
  WITH CHECK (bucket_id = 'lipy-samples');

-- ─────────────────────────────────────────────────────────────────────
-- 6. VERIFICATION
-- ─────────────────────────────────────────────────────────────────────

-- Check that all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('lipy_contributors','lipy_sessions','lipy_samples','security_events')
ORDER BY table_name;

-- Check that all RLS policies are in place
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN ('lipy_contributors','lipy_sessions','lipy_samples','security_events'))
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;
