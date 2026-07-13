/**
 * Verification Service
 *
 * Always accepts and stores samples to Supabase. If the LiPy model produces a
 * high-confidence prediction that matches the expected character, the sample
 * is marked as `verified`. Otherwise it's saved as `unverified`.
 *
 * Stages:
 *   1. Model prediction  — run LiPy recognition model
 *   2. Acceptance        — always store in Supabase; decide verified/unverified
 */

import { createClient } from '@supabase/supabase-js';
import { MIN_VERIFICATION_CONFIDENCE } from '@/constants/LiPy';
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
}

export interface VerificationLogEntry {
  timestamp: string;
  contributorId: string;
  expectedCharacter: string;
  predictedCharacter: string | null;
  confidence: number | null;
  accepted: boolean;
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
  startTime: number;
  supabase: SupabaseClientShim;
  config: {
    minConfidence: number;
  };
}

export interface ContributorState {
  contributorId: string;
  totalVerified: number;
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
 * Stage 1: Run the LiPy recognition model on the image.
 * Calls the same /predict endpoint used by the OCR feature.
 * Always returns passed: true — prediction failures are recorded
 * but don't block acceptance; the sample is saved as 'unverified'.
 */
const modelPredictionStage: VerificationStage = {
  name: 'model_prediction',
  async execute(ctx: VerificationContext): Promise<VerificationStageResult> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

    // If the model API is unavailable, log the error and let the sample
    // fall through to acceptance as 'unverified'.
    if (!apiUrl) {
      console.warn('Model API URL not configured — saving sample as unverified');
      return { passed: true };
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
        console.warn(`Model API returned status ${response.status} — saving sample as unverified`);
        return { passed: true };
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
      console.warn(`Model prediction error: ${msg} — saving sample as unverified`);
      return { passed: true };
    }
  },
};

/**
 * Helper: determine if a model prediction passes verification checks.
 * Checks confidence threshold and character match.
 */
function doesPredictionPass(
  prediction: ModelPrediction | null,
  expectedCharacterId: string,
  expectedCharacter: string,
  minConfidence: number,
): boolean {
  if (!prediction) return false;
  if (prediction.confidence < minConfidence) return false;

  const predictedId = prediction.characterId;
  const predictedChar = prediction.character;

  // 1. Match by character ID (most reliable)
  if (predictedId && predictedId === expectedCharacterId) return true;

  // 2. Match by character text with Unicode normalization
  if (predictedChar && expectedCharacter) {
    const normalizedPredicted = predictedChar.normalize('NFC');
    const normalizedExpected = expectedCharacter.normalize('NFC');
    if (normalizedPredicted === normalizedExpected) return true;
  }

  // 3. Try matching by prediction label via top_predictions
  const raw = prediction.raw as Record<string, unknown> | null;
  if (raw?.top_predictions && Array.isArray(raw.top_predictions)) {
    for (const entry of raw.top_predictions) {
      const label = String(entry?.label ?? '');
      if (label && findIdByLabel(label) === expectedCharacterId) return true;
    }
  }

  return false;
}

/**
 * Stage 2 (Final): Store the sample in Supabase Storage + Database.
 * Always saves the sample — the `verified` status depends on whether the
 * model prediction passed confidence and character match checks.
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

      // 3. Upsert contributor record — track last seen and verified count
      const now = nowIso();
      const modelPassed = doesPredictionPass(
        ctx.prediction,
        req.expectedCharacterId,
        req.expectedCharacter,
        ctx.config.minConfidence,
      );
      // isVerified = model prediction passed (confidence + character match)
      const isVerified = modelPassed;

      const contributorPayload: Record<string, unknown> = {
        contributor_id: req.contributorId,
        contributor_name: req.contributorName,
        last_seen_at: now,
      };

      if (isVerified) {
        contributorPayload.total_verified = (ctx.contributor?.totalVerified ?? 0) + 1;
        contributorPayload.last_verified_at = now;
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

      // 5. Insert sample record with appropriate status
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
        status: isVerified ? 'verified' : 'unverified',
        verified_by: isVerified ? VERIFICATION_SERVICE_UUID : null,
        verified_at: isVerified ? now : null,
        upload_status: 'uploaded',
        retry_count: 0,
        metadata: {
          contributorId: req.contributorId,
          contributorName: req.contributorName,
          sessionId: req.sessionId,
          mode: req.mode,
          characterId: req.expectedCharacterId,
          character: req.expectedCharacter,
          verifiedBy: isVerified ? 'verification_service' : 'unverified',
          verifiedAt: isVerified ? now : null,
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
      .select('contributor_id, total_verified, last_verified_at')
      .eq('contributor_id', contributorId)
      .single();

    if (error || !data) return null;

    return {
      contributorId: String(data.contributor_id ?? ''),
      totalVerified: Number(data.total_verified ?? 0),
      lastVerifiedAt: data.last_verified_at ? String(data.last_verified_at) : null,
    };
  } catch {
    return null;
  }
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
 * Run the verification pipeline for a given request.
 *
 * The pipeline always runs model prediction, then stores the sample.
 * If the prediction passes confidence + character match checks, the sample
 * is stored as 'verified'; otherwise it's stored as 'unverified'.
 *
 * @param request - The verification request containing image and metadata
 * @returns VerificationResult with acceptance decision
 */
export async function verifySample(
  request: VerificationRequest,
): Promise<VerificationResult> {
  const startTime = Date.now();
  const supabase = getSupabaseClient();

  const context: VerificationContext = {
    request,
    contributor: null,
    prediction: null,
    startTime,
    supabase,
    config: {
      minConfidence: MIN_VERIFICATION_CONFIDENCE,
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

  // Build pipeline: always run model prediction, then always accept
  const stages: VerificationStage[] = [modelPredictionStage, acceptanceStage];

  for (const stage of stages) {
    try {
      const result = await stage.execute(context);

      if (!result.passed) {
        failedStage = stage.name;
        failedReason = result.reason || 'Stage failed';
        break;
      }

      // If acceptance stage passed, the sample is fully stored
      if (stage.name === 'acceptance') {
        finalAccepted = true;
        finalMessage = 'Sample submitted successfully.';
      }
    } catch (error) {
      failedStage = stage.name;
      failedReason = error instanceof Error ? error.message : 'Stage threw exception';
      break;
    }
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
