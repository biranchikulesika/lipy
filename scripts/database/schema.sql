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

-- ─── 2a. Admins ───
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'verifier', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2b. Contributors ───
CREATE TABLE IF NOT EXISTS lipy_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id TEXT NOT NULL,
  contributor_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_verified INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS lipy_contributors_contributor_id_key
  ON lipy_contributors (contributor_id);

CREATE INDEX IF NOT EXISTS idx_lipy_contributors_last_seen
  ON lipy_contributors (last_seen_at DESC);



-- ─── 2c. Sessions ───
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

CREATE UNIQUE INDEX IF NOT EXISTS lipy_sessions_contributor_id_session_id_key
  ON lipy_sessions (contributor_id, session_id);

CREATE INDEX IF NOT EXISTS idx_lipy_sessions_updated_at
  ON lipy_sessions (updated_at DESC);

-- ─── 2d. Samples ───
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
  storage_bucket TEXT NOT NULL DEFAULT 'lipy-samples',
  storage_path TEXT NOT NULL,
  blob_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  upload_status TEXT NOT NULL DEFAULT 'uploaded',
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR DEFAULT 'unverified',
  -- verified_by: '00000000-0000-0000-0000-000000000000' for auto-verification service;
  --             admin UUID for manual verification; null for unverified samples
  -- NOTE: No FK constraint to auth.users — the sentinel UUID must be allowed.
  verified_by UUID,
  verified_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS lipy_samples_client_sample_id_key
  ON lipy_samples (client_sample_id);

CREATE UNIQUE INDEX IF NOT EXISTS lipy_samples_storage_path_key
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

CREATE INDEX IF NOT EXISTS lipy_samples_contributor_session_idx
  ON lipy_samples (contributor_id, session_id);

CREATE INDEX IF NOT EXISTS lipy_samples_uploaded_at_idx
  ON lipy_samples (uploaded_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS lipy_samples_character_idx
  ON lipy_samples (character_id);

-- ─── 2e. Verification Logs ───
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL,
  contributor_id TEXT NOT NULL,
  expected_character TEXT NOT NULL,
  predicted_character TEXT,
  confidence DOUBLE PRECISION,
  accepted BOOLEAN NOT NULL,
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

-- ─── 2f. Security Events ───
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

-- ─────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────

-- 3a. Enable RLS on all tables
ALTER TABLE lipy_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lipy_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE lipy_samples       ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins             ENABLE ROW LEVEL SECURITY;

-- 3b. Anon policies (used by dataset sync / public contributors)

DROP POLICY IF EXISTS "anon_select_lipy_contributors" ON lipy_contributors;
CREATE POLICY "anon_select_lipy_contributors" ON lipy_contributors
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_lipy_contributors" ON lipy_contributors;
CREATE POLICY "anon_insert_lipy_contributors" ON lipy_contributors
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lipy_contributors" ON lipy_contributors;
CREATE POLICY "anon_update_lipy_contributors" ON lipy_contributors
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_lipy_sessions" ON lipy_sessions;
CREATE POLICY "anon_select_lipy_sessions" ON lipy_sessions
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_lipy_sessions" ON lipy_sessions;
CREATE POLICY "anon_insert_lipy_sessions" ON lipy_sessions
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lipy_sessions" ON lipy_sessions;
CREATE POLICY "anon_update_lipy_sessions" ON lipy_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_lipy_samples" ON lipy_samples;
CREATE POLICY "anon_select_lipy_samples" ON lipy_samples
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_lipy_samples" ON lipy_samples;
CREATE POLICY "anon_insert_lipy_samples" ON lipy_samples
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lipy_samples" ON lipy_samples;
CREATE POLICY "anon_update_lipy_samples" ON lipy_samples
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 3c. Authenticated policies (used by admin dashboard)

DROP POLICY IF EXISTS "auth_select_lipy_samples" ON lipy_samples;
CREATE POLICY "auth_select_lipy_samples" ON lipy_samples
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_select_lipy_contributors" ON lipy_contributors;
CREATE POLICY "auth_select_lipy_contributors" ON lipy_contributors
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_select_lipy_sessions" ON lipy_sessions;
CREATE POLICY "auth_select_lipy_sessions" ON lipy_sessions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_select_security_events" ON security_events;
CREATE POLICY "auth_select_security_events" ON security_events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_security_events" ON security_events;
CREATE POLICY "auth_insert_security_events" ON security_events
  FOR INSERT TO authenticated WITH CHECK (true);

-- Service role manages admins
DROP POLICY IF EXISTS "Service role manages admins" ON admins;
CREATE POLICY "Service role manages admins" ON admins
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────────
-- 4. STORAGE BUCKET
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'lipy-samples', 'lipy-samples', false, 5242880, '{image/png,image/jpeg}'
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'lipy-samples');

-- Allow anon to upload images into the lipy-samples bucket
DROP POLICY IF EXISTS "anon_insert_lipy_objects" ON storage.objects;
CREATE POLICY "anon_insert_lipy_objects" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'lipy-samples');

-- Allow anon to read images from the lipy-samples bucket
DROP POLICY IF EXISTS "anon_select_lipy_objects" ON storage.objects;
CREATE POLICY "anon_select_lipy_objects" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'lipy-samples');

-- Allow anon to update/overwrite files in the lipy-samples bucket
DROP POLICY IF EXISTS "anon_upsert_lipy_objects" ON storage.objects;
CREATE POLICY "anon_upsert_lipy_objects" ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id = 'lipy-samples')
  WITH CHECK (bucket_id = 'lipy-samples');

-- Allow anon to delete files from the lipy-samples bucket
DROP POLICY IF EXISTS "anon_delete_lipy_objects" ON storage.objects;
CREATE POLICY "anon_delete_lipy_objects" ON storage.objects
  FOR DELETE TO anon
  USING (bucket_id = 'lipy-samples');

-- ─────────────────────────────────────────────────────────────────────
-- 5. FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────

-- Revoke all refresh tokens and sessions for a user EXCEPT the current session
CREATE OR REPLACE FUNCTION public.revoke_other_sessions(p_user_id text, p_current_session_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM auth.refresh_tokens
  WHERE user_id = p_user_id
    AND (session_id IS DISTINCT FROM p_current_session_id);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM auth.sessions
  WHERE user_id::text = p_user_id
    AND id != p_current_session_id;

  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_other_sessions(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.revoke_other_sessions(text, uuid) TO authenticated;

-- Check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE id = uid);
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 6. VERIFICATION
-- ─────────────────────────────────────────────────────────────────────

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('lipy_contributors','lipy_sessions','lipy_samples','verification_logs','security_events','admins')
ORDER BY table_name;

SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE (schemaname = 'public' AND tablename IN ('lipy_contributors','lipy_sessions','lipy_samples','verification_logs','security_events','admins'))
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;
