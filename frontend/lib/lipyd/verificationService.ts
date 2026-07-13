/**
 * Verification Service
 *
 * Modular verification pipeline for validating handwriting samples before
 * they enter the dataset. Designed so new verification stages can be
 * inserted without changing the upload API.
 *
 * Current stages:
 *   1. Ban check        — reject if contributor is temporarily banned
 *   2. Model prediction  — run LiPy recognition model
 *   3. Confidence check  — reject if below threshold
 *   4. Character match   — reject if predicted ≠ expected
 *   5. Acceptance        — store in Supabase, update contributor state
 *
 * Future stages (just add to the pipeline array):
 *   - duplicate image detection
 *   - blank canvas detection
 *   - excessive stroke detection
 *   - AI-generated image detection
 *   - contributor reputation weighting
 *   - manual review queue
 *   - ensemble model verification
 */

import { createClient } from '@supabase/supabase-js';
import {
  MIN_VERIFICATION_CONFIDENCE,
  MAX_INVALID_STREAK,
  TEMP_BAN_DURATION_HOURS,
  TRUST_SCORE_INITIAL,
  TRUST_BAN_THRESHOLD,
  TRUST_PENALTY,
} from '@/constants/LiPy';
import { odiaCharacters } from './odiaCharacters';

// ─── Types ───

export interface VerificationRequest {
  imageBase64: string;
  mimeType: string;
  expectedCharacterId: string;
  expectedCharacter: string;
  contributorId: string;
  contributorName: string;
  sessionId: string;
  mode: string;
  clientSampleId: string;
  sampleNumber: number;
  filename: string;
  timestamp: string;
}

export interface VerificationResult {
  accepted: boolean;
  message: string;
  details?: {
    predictedCharacter?: string;
    predictedCharacterId?: string;
    confidence?: number;
    reason?: string;
  };
}

export interface VerificationLogEntry {
  timestamp: string;
  contributorId: string;
  expectedCharacter: string;
  predictedCharacter: string | null;
  confidence: number | null;
  accepted: boolean;
  invalidStreakAfterRequest: number;
  temporaryBanApplied: boolean;
  processingTimeMs: number;
  stage?: string;
  reason?: string;
}

// ─── Stage interface ───

export interface VerificationStage {
  name: string;
  execute(context: VerificationContext): Promise<VerificationStageResult>;
}

export interface VerificationStageResult {
  passed: boolean;
  reason?: string;
  data?: Record<string, unknown>;
}

export interface VerificationContext {
  request: VerificationRequest;
  contributor: ContributorState | null;
  prediction: ModelPrediction | null;
  logs: VerificationLogEntry[];
  startTime: number;
  supabase: SupabaseClientShim;
  config: {
    minConfidence: number;
    maxInvalidStreak: number;
    banDurationHours: number;
  };
}

export interface ContributorState {
  contributorId: string;
  invalidStreak: number;
  bannedUntil: string | null;
  trustScore: number;
  totalVerified: number;
  totalRejected: number;
  lastInvalidAt: string | null;
  lastVerifiedAt: string | null;
}

export interface ModelPrediction {
  character: string | null;
  characterId: string | null;
  confidence: number;
  raw: unknown;
}

// ─── Supabase client shim ───
// Using a loose type to avoid strict schema validation from @supabase/supabase-js
// when no Database type definition file is present in the project.

interface SupabaseClientShim {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
        limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
      };
      single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
      order: (col: string, opts?: { ascending?: boolean }) => {
        limit: (n: number) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
      };
    };
    upsert: (
      values: Record<string, unknown>,
      opts?: { onConflict?: string },
    ) => Promise<{ error: unknown; data: unknown }>;
    insert: (
      values: Record<string, unknown>,
    ) => Promise<{ error: unknown; data: unknown }>;
  };
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Blob,
        opts?: { contentType?: string; upsert?: boolean },
      ) => Promise<{ error: { message: string } | null; data: unknown }>;
      remove: (paths: string[]) => Promise<{ error: unknown }>;
    };
  };
}

// ─── Character ID lookup maps ───
// Map from Odia character text (e.g., "ଖ") to character ID (e.g., "CONS_KHA")
const charToIdMap = new Map<string, string>();
// Map from class label (e.g., "CONS_KHA") to character ID (same value, but
// useful when the model only returns the label without the character text)
const labelToIdMap = new Map<string, string>();

for (const c of odiaCharacters) {
  charToIdMap.set(c.char, c.id);
  labelToIdMap.set(c.id, c.id);
}

function findCharacterId(char: string): string | null {
  return charToIdMap.get(char) ?? null;
}

function findIdByLabel(label: string): string | null {
  // The label is the same as the character ID (e.g., "CONS_KHA")
  return labelToIdMap.get(label) ?? null;
}

// ─── Sentinel UUID for auto-verification ───
// Used as verified_by on samples auto-verified by the verification pipeline.
// The admin UI recognizes this UUID and displays "Auto-Verification Service".
const VERIFICATION_SERVICE_UUID = '00000000-0000-0000-0000-000000000000';

// ─── Supabase helpers ───

function getStorageBucket(): string {
  return process.env.NEXT_PUBLIC_LIPY_STORAGE_BUCKET || 'lipy-samples';
}

function getSupabaseClient(): SupabaseClientShim {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceKey) {
    throw new Error('Supabase URL or service role key is not configured');
  }
  return createClient(url, serviceKey) as unknown as SupabaseClientShim;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildStoragePath(request: VerificationRequest): string {
  const safe = (s: string, fallback = 'unknown') =>
    String(s || '').replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 80) || fallback;
  return [
    safe(request.contributorId, 'contributor'),
    safe(request.sessionId, 'session'),
    safe(request.expectedCharacterId, 'character'),
    `${safe(request.clientSampleId, 'sample')}.png`,
  ].join('/');
}

// ─── Stage implementations ───

/**
 * Stage 0: Check if the contributor is temporarily banned.
 */
const banCheckStage: VerificationStage = {
  name: 'ban_check',
  async execute(ctx: VerificationContext): Promise<VerificationStageResult> {
    if (!ctx.contributor) {
      return { passed: true };
    }

    if (!ctx.contributor.bannedUntil) {
      return { passed: true };
    }

    const bannedUntil = new Date(ctx.contributor.bannedUntil).getTime();
    const now = Date.now();

    if (now < bannedUntil) {
      return { passed: false, reason: 'Contributor is temporarily banned' };
    }

    return { passed: true };
  },
};

/**
 * Stage 1: Run the LiPy recognition model on the image.
 * Calls the same /predict endpoint used by the OCR feature.
 */
const modelPredictionStage: VerificationStage = {
  name: 'model_prediction',
  async execute(ctx: VerificationContext): Promise<VerificationStageResult> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!apiUrl) {
      return { passed: false, reason: 'Model API URL is not configured' };
    }

    try {
      const byteString = atob(ctx.request.imageBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: ctx.request.mimeType || 'image/png' });

      const formData = new FormData();
      formData.append('image', blob, 'verification.png');

      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return { passed: false, reason: `Model API returned status ${response.status}` };
      }

      const rawPrediction = (await response.json()) as {
        status: string;
        prediction: string | null;
        confidence: number;
        character: string | null;
        top_predictions?: Array<{ label: string; confidence: number; character: string }>;
      };

      // Resolve the character ID using the best available field.
      // Priority:
      //   1. `character` — the actual Odia text (e.g., "ଖ")
      //   2. `prediction` — the class label (e.g., "CONS_KHA")
      //   3. First entry in `top_predictions[0].label` — fallback label
      let characterId: string | null = null;
      let characterLabel: string | null = rawPrediction.prediction ?? null;

      if (rawPrediction.character) {
        characterId = findCharacterId(rawPrediction.character);
      }

      if (!characterId && rawPrediction.prediction) {
        characterId = findIdByLabel(rawPrediction.prediction);
      }

      if (!characterId && rawPrediction.top_predictions?.length) {
        const topLabel = rawPrediction.top_predictions[0].label;
        characterLabel = topLabel;
        characterId = findIdByLabel(topLabel);
      }

      ctx.prediction = {
        character: characterLabel,
        characterId,
        confidence: rawPrediction.confidence ?? 0,
        raw: rawPrediction,
      };

      return { passed: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Model prediction failed';
      return { passed: false, reason: msg };
    }
  },
};

/**
 * Stage 2: Check that model confidence exceeds the minimum threshold.
 */
const confidenceCheckStage: VerificationStage = {
  name: 'confidence_check',
  async execute(ctx: VerificationContext): Promise<VerificationStageResult> {
    if (!ctx.prediction) {
      return { passed: false, reason: 'No prediction available' };
    }

    if (ctx.prediction.confidence < ctx.config.minConfidence) {
      return {
        passed: false,
        reason: `Confidence ${(ctx.prediction.confidence * 100).toFixed(1)}% below minimum ${(ctx.config.minConfidence * 100).toFixed(0)}%`,
      };
    }

    return { passed: true };
  },
};

/**
 * Stage 3: Check that the predicted character matches the expected character.
 *
 * Matching is attempted in this priority order:
 *   1. Character ID match — predicted character ID === expected character ID
 *   2. Character text match — predicted character text === expected character text
 *   3. Label fallback — predicted label resolves to expected character ID
 */
const characterMatchStage: VerificationStage = {
  name: 'character_match',
  async execute(ctx: VerificationContext): Promise<VerificationStageResult> {
    if (!ctx.prediction) {
      return { passed: false, reason: 'No prediction available' };
    }

    const expectedId = ctx.request.expectedCharacterId;
    const predictedId = ctx.prediction.characterId;
    const predictedChar = ctx.prediction.character;

    // 1. Match by character ID (most reliable)
    if (predictedId && predictedId === expectedId) {
      return { passed: true };
    }

    // 2. Match by character text with Unicode normalization
    if (predictedChar && ctx.request.expectedCharacter) {
      // Normalize both to NFC to avoid Unicode form mismatch
      const normalizedPredicted = predictedChar.normalize('NFC');
      const normalizedExpected = ctx.request.expectedCharacter.normalize('NFC');
      if (normalizedPredicted === normalizedExpected) {
        return { passed: true };
      }
    }

    // 3. Try matching by prediction label via top_predictions if available
    const raw = ctx.prediction.raw as Record<string, unknown> | null;
    if (raw?.top_predictions && Array.isArray(raw.top_predictions)) {
      for (const entry of raw.top_predictions) {
        const label = String(entry?.label ?? '');
        if (label && findIdByLabel(label) === expectedId) {
          return { passed: true };
        }
      }
    }

    return {
      passed: false,
      reason: 'Predicted character does not match expected',
    };
  },
};

/**
 * Stage 4 (Final): Store the verified sample in Supabase Storage + Database.
 */
const acceptanceStage: VerificationStage = {
  name: 'acceptance',
  async execute(ctx: VerificationContext): Promise<VerificationStageResult> {
    const supabase = ctx.supabase;
    const req = ctx.request;
    const storagePath = buildStoragePath(req);

    try {
      // 1. Convert base64 to Blob for storage upload
      const byteString = atob(req.imageBase64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: req.mimeType || 'image/png' });

      // 2. Upload image to Supabase Storage
      const uploadResult = await supabase.storage
        .from(getStorageBucket())
        .upload(storagePath, blob, {
          contentType: req.mimeType || 'image/png',
          upsert: true,
        });

      if (uploadResult.error) {
        return { passed: false, reason: `Storage upload failed: ${uploadResult.error.message}` };
      }

      // 3. Upsert contributor record with updated state
      const now = nowIso();
      const contributorPayload: Record<string, unknown> = {
        contributor_id: req.contributorId,
        contributor_name: req.contributorName,
        last_seen_at: now,
        total_verified: (ctx.contributor?.totalVerified ?? 0) + 1,
        invalid_streak: 0,
        last_verified_at: now,
        last_invalid_at: ctx.contributor?.lastInvalidAt ?? null,
        trust_score: Math.min(100, (ctx.contributor?.trustScore ?? TRUST_SCORE_INITIAL) + 1),
      };

      if (ctx.contributor?.bannedUntil) {
        contributorPayload.banned_until = null;
      }

      const contributorResult = await supabase
        .from('lipy_contributors')
        .upsert(contributorPayload, { onConflict: 'contributor_id' });

      if (contributorResult.error) {
        console.error('Contributor upsert failed:', String(contributorResult.error));
      }

      // 4. Upsert session record
      const sessionResult = await supabase
        .from('lipy_sessions')
        .upsert(
          {
            contributor_id: req.contributorId,
            session_id: req.sessionId,
            mode: req.mode,
            started_at: req.timestamp,
            updated_at: now,
            user_agent: 'server-side-verification',
          },
          { onConflict: 'contributor_id,session_id' },
        );

      if (sessionResult.error) {
        console.error('Session upsert failed:', String(sessionResult.error));
      }

      // 5. Insert sample record with verified status
      const samplePayload: Record<string, unknown> = {
        client_sample_id: req.clientSampleId,
        contributor_id: req.contributorId,
        contributor_name: req.contributorName,
        session_id: req.sessionId,
        mode: req.mode,
        character_id: req.expectedCharacterId,
        character_text: req.expectedCharacter,
        sample_number: req.sampleNumber,
        filename: req.filename,
        storage_bucket: getStorageBucket(),
        storage_path: storagePath,
        blob_bytes: blob.size,
        mime_type: req.mimeType || 'image/png',
        status: 'verified',
        verified_by: VERIFICATION_SERVICE_UUID,
        verified_at: now,
        upload_status: 'uploaded',
        retry_count: 0,
        metadata: {
          contributorId: req.contributorId,
          contributorName: req.contributorName,
          sessionId: req.sessionId,
          mode: req.mode,
          characterId: req.expectedCharacterId,
          character: req.expectedCharacter,
          verifiedBy: 'verification_service',
          verifiedAt: now,
          confidence: ctx.prediction?.confidence ?? null,
          predictedCharacter: ctx.prediction?.character ?? null,
        },
        created_at: req.timestamp,
        uploaded_at: now,
      };

      const sampleResult = await supabase
        .from('lipy_samples')
        .upsert(samplePayload, { onConflict: 'client_sample_id' });

      if (sampleResult.error) {
        await supabase.storage.from(getStorageBucket()).remove([storagePath]);
        return { passed: false, reason: `Database insert failed: ${String(sampleResult.error)}` };
      }

      return { passed: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Acceptance stage failed';
      return { passed: false, reason: msg };
    }
  },
};

// ─── Contributor state lookup ───

async function getContributorState(
  supabase: SupabaseClientShim,
  contributorId: string,
): Promise<ContributorState | null> {
  try {
    const { data, error } = await supabase
      .from('lipy_contributors')
      .select(
        'contributor_id, invalid_streak, banned_until, trust_score, total_verified, total_rejected, last_invalid_at, last_verified_at',
      )
      .eq('contributor_id', contributorId)
      .single();

    if (error || !data) return null;

    return {
      contributorId: String(data.contributor_id ?? ''),
      invalidStreak: Number(data.invalid_streak ?? 0),
      bannedUntil: data.banned_until ? String(data.banned_until) : null,
      trustScore: Number(data.trust_score ?? 0),
      totalVerified: Number(data.total_verified ?? 0),
      totalRejected: Number(data.total_rejected ?? 0),
      lastInvalidAt: data.last_invalid_at ? String(data.last_invalid_at) : null,
      lastVerifiedAt: data.last_verified_at ? String(data.last_verified_at) : null,
    };
  } catch {
    return null;
  }
}

// ─── Invalid streak / ban update ───

async function recordInvalidSubmission(
  supabase: SupabaseClientShim,
  contributorId: string,
  contributorName: string,
  currentStreak: number,
  currentTrustScore: number,
): Promise<{ newStreak: number; banApplied: boolean }> {
  const newStreak = currentStreak + 1;
  const newTrustScore = Math.max(0, currentTrustScore + TRUST_PENALTY);
  const now = nowIso();
  let banApplied = false;

  const payload: Record<string, unknown> = {
    contributor_id: contributorId,
    contributor_name: contributorName,
    last_seen_at: now,
    invalid_streak: newStreak,
    last_invalid_at: now,
    trust_score: newTrustScore,
  };

  if (newStreak >= MAX_INVALID_STREAK || newTrustScore < TRUST_BAN_THRESHOLD) {
    const banUntil = new Date(Date.now() + TEMP_BAN_DURATION_HOURS * 60 * 60 * 1000).toISOString();
    payload.banned_until = banUntil;
    banApplied = true;
  }

  // Read current total_rejected to increment it
  try {
    const { data: existing } = await supabase
      .from('lipy_contributors')
      .select('total_rejected')
      .eq('contributor_id', contributorId)
      .single();

    payload.total_rejected = (existing ? Number((existing as Record<string, unknown>).total_rejected ?? 0) : 0) + 1;
  } catch {
    payload.total_rejected = 1;
  }

  await supabase.from('lipy_contributors').upsert(payload, { onConflict: 'contributor_id' });

  return { newStreak, banApplied };
}

// ─── Internal logging ───
// Logs are kept in-memory for instant access AND persisted to the
// verification_logs table in Supabase for durability across restarts.

const verificationLogs: VerificationLogEntry[] = [];
const MAX_LOG_ENTRIES = 10000;

/**
 * Persist a log entry to the verification_logs Supabase table.
 * Fire-and-forget — failures are logged but never block the pipeline.
 */
async function persistLogToSupabase(entry: VerificationLogEntry): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('verification_logs').insert({
      timestamp: entry.timestamp,
      contributor_id: entry.contributorId,
      expected_character: entry.expectedCharacter,
      predicted_character: entry.predictedCharacter ?? null,
      confidence: entry.confidence ?? null,
      accepted: entry.accepted,
      invalid_streak_after_request: entry.invalidStreakAfterRequest,
      temporary_ban_applied: entry.temporaryBanApplied,
      processing_time_ms: entry.processingTimeMs,
      stage: entry.stage ?? null,
      reason: entry.reason ?? null,
    });
  } catch {
    // Non-critical — in-memory cache still works
  }
}

function appendLog(entry: VerificationLogEntry): void {
  verificationLogs.push(entry);
  if (verificationLogs.length > MAX_LOG_ENTRIES) {
    verificationLogs.splice(0, verificationLogs.length - MAX_LOG_ENTRIES);
  }

  // Persist to Supabase in the background (don't await — non-blocking)
  // Errors are handled internally by persistLogToSupabase.
  persistLogToSupabase(entry);
}

/**
 * Get recent verification logs from the in-memory cache.
 * The admin API also queries Supabase for a merged view with historical depth.
 */
export function getVerificationLogs(limit = 100): VerificationLogEntry[] {
  return verificationLogs.slice(-limit).reverse();
}

/**
 * Get verification logs from the Supabase table for historical queries.
 * Falls back to in-memory if the DB query fails.
 */
export async function getPersistedLogs(limit = 200): Promise<VerificationLogEntry[]> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('verification_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!data || !Array.isArray(data)) {
      return getVerificationLogs(limit);
    }

    return (data as Array<Record<string, unknown>>).map((row) => ({
      timestamp: String(row.timestamp ?? ''),
      contributorId: String(row.contributor_id ?? ''),
      expectedCharacter: String(row.expected_character ?? ''),
      predictedCharacter: row.predicted_character ? String(row.predicted_character) : null,
      confidence: row.confidence != null ? Number(row.confidence) : null,
      accepted: Boolean(row.accepted),
      invalidStreakAfterRequest: Number(row.invalid_streak_after_request ?? 0),
      temporaryBanApplied: Boolean(row.temporary_ban_applied),
      processingTimeMs: Number(row.processing_time_ms ?? 0),
      stage: row.stage ? String(row.stage) : undefined,
      reason: row.reason ? String(row.reason) : undefined,
    }));
  } catch {
    // Fallback to in-memory
    return getVerificationLogs(limit);
  }
}

/**
 * Clear in-memory verification logs.
 */
export function clearVerificationLogs(): void {
  verificationLogs.length = 0;
}

// ─── Pipeline execution ───

/**
 * The default verification pipeline, ordered by execution.
 * New stages can be inserted at any position.
 */
const DEFAULT_PIPELINE: VerificationStage[] = [
  banCheckStage,
  modelPredictionStage,
  confidenceCheckStage,
  characterMatchStage,
  acceptanceStage,
];

/**
 * Run the verification pipeline for a given request.
 *
 * @param request - The verification request containing image and metadata
 * @param pipeline - Optional custom pipeline (defaults to DEFAULT_PIPELINE)
 * @returns VerificationResult with acceptance decision
 */
export async function verifySample(
  request: VerificationRequest,
  pipeline: VerificationStage[] = DEFAULT_PIPELINE,
): Promise<VerificationResult> {
  const startTime = Date.now();
  const supabase = getSupabaseClient();

  const context: VerificationContext = {
    request,
    contributor: null,
    prediction: null,
    logs: [],
    startTime,
    supabase,
    config: {
      minConfidence: MIN_VERIFICATION_CONFIDENCE,
      maxInvalidStreak: MAX_INVALID_STREAK,
      banDurationHours: TEMP_BAN_DURATION_HOURS,
    },
  };

  // Load contributor state at the start
  try {
    context.contributor = await getContributorState(supabase, request.contributorId);
  } catch {
    // Contributor not found — treated as new contributor
  }

  let finalAccepted = false;
  let finalMessage = 'Unable to process this submission. Please try again.';
  let failedStage = '';
  let failedReason = '';
  let banApplied = false;
  let newStreak = context.contributor?.invalidStreak ?? 0;

  for (const stage of pipeline) {
    try {
      const result = await stage.execute(context);

      if (!result.passed) {
        failedStage = stage.name;
        failedReason = result.reason || 'Stage failed';

        // Record failure for abuse tracking (skip for ban_check — they're already banned)
        if (stage.name !== 'ban_check') {
          try {
            const streakResult = await recordInvalidSubmission(
              supabase,
              request.contributorId,
              request.contributorName,
              context.contributor?.invalidStreak ?? 0,
              context.contributor?.trustScore ?? TRUST_SCORE_INITIAL,
            );
            newStreak = streakResult.newStreak;
            banApplied = streakResult.banApplied;
          } catch {
            // Non-critical
          }
        }

        break;
      }

      // If acceptance stage passed, the sample is fully verified and stored
      if (stage.name === 'acceptance') {
        finalAccepted = true;
        finalMessage = 'Sample submitted successfully.';
      }
    } catch (error) {
      failedStage = stage.name;
      failedReason = error instanceof Error ? error.message : 'Stage threw exception';

      if (stage.name !== 'ban_check') {
        try {
          const streakResult = await recordInvalidSubmission(
            supabase,
            request.contributorId,
            request.contributorName,
            context.contributor?.invalidStreak ?? 0,
            context.contributor?.trustScore ?? TRUST_SCORE_INITIAL,
          );
          newStreak = streakResult.newStreak;
          banApplied = streakResult.banApplied;
        } catch {
          // Non-critical
        }
      }

      break;
    }
  }

  // For ban_check failures, keep the original streak (not incremented again)
  if (!finalAccepted && failedStage === 'ban_check') {
    newStreak = context.contributor?.invalidStreak ?? 0;
  }

  const processingTimeMs = Date.now() - startTime;

  // Build internal log entry
  const logEntry: VerificationLogEntry = {
    timestamp: nowIso(),
    contributorId: request.contributorId,
    expectedCharacter: request.expectedCharacter,
    predictedCharacter: context.prediction?.character ?? null,
    confidence: context.prediction?.confidence ?? null,
    accepted: finalAccepted,
    invalidStreakAfterRequest: newStreak,
    temporaryBanApplied: banApplied,
    processingTimeMs,
    stage: failedStage || 'complete',
    reason: failedReason || (finalAccepted ? 'accepted' : 'unknown'),
  };

  appendLog(logEntry);

  if (finalAccepted) {
    return {
      accepted: true,
      message: finalMessage,
    };
  }

  // Generic failure — never expose internal details
  return {
    accepted: false,
    message: finalMessage,
  };
}
