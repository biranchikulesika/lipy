import db, {
  getPendingUploadCount,
  updateSampleSyncState,
  deleteSample,
  getVerificationFailedSamples,
  SampleRecord,
  incrementLifetimeCount,
} from './storageService';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { odiaCharacters } from './odiaCharacters';
import { ensureValidSessionId, isValidContributorName, isValidMode } from './validators';

const STORAGE_BUCKET = 'lipy-samples';
const MAX_BLOB_BYTES = 4 * 1024 * 1024;
const MAX_RETRY_ATTEMPTS = 10;
const VERIFICATION_API_MAX_RETRIES = 3;
const characterIds = new Set(odiaCharacters.map((item) => item.id));

const VERIFICATION_FAILED_MARKER = '__verification_failed__';
const REJECTED_MARKER = '__rejected__';

// Maximum number of automatic batch re-verify attempts per sample.
// After this many failed re-verifications, the sample is left alone
// until the contributor manually retries via the review panel.
const MAX_AUTO_VERIFY_ATTEMPTS = 2;

function getAutoVerifyKey(contributorId: string, clientSampleId: string): string {
  return `lipy_auto_reverify_${contributorId}_${clientSampleId}`;
}

// Check if the verification API should be used.
// The verification API needs the LiPy model endpoint to function.
// In Next.js client components, NEXT_PUBLIC_* are replaced at build time.
function isVerificationApiConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_URL);
}

// Get the verification API URL (always on the same origin)
function getVerificationApiUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/lipyd/verify`;
  }
  return '/api/lipyd/verify';
}

// Helper to convert Blob to base64 string
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the Data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const listeners = new Set<Function>();
let processingPromise: Promise<void> | null = null;
let retryTimer: any = null;
let listenersAttached = false;

let state = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  pendingCount: 0,
  uploadedCount: 0,
  failedCount: 0,
  lastError: '',
  configured: isSupabaseConfigured(),
};

function nowIso() {
  return new Date().toISOString();
}

function getCurrentOnlineState() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

function shortRandomSuffix(length = 8) {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function createClientSampleId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) { }
  return `sample_${Date.now()}_${shortRandomSuffix()}`;
}

function safeSegment(value: string | null | undefined, fallback = 'unknown') {
  const text = String(value || '').trim();
  if (!text) return fallback;
  return text.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 80) || fallback;
}

function buildStoragePath(sample: any) {
  return [
    safeSegment(sample.contributorId, 'contributor'),
    safeSegment(sample.sessionId, 'session'),
    safeSegment(sample.characterId, 'character'),
    `${safeSegment(sample.clientSampleId, 'sample')}.png`,
  ].join('/');
}

async function refreshState(patch = {}) {
  const pendingCount = await getPendingUploadCount();
  state = {
    ...state,
    ...patch,
    online: getCurrentOnlineState(),
    configured: isSupabaseConfigured(),
    pendingCount,
  };

  for (const listener of Array.from(listeners)) {
    try {
      listener({ ...state });
    } catch (e) { }
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lipy:sync-state-changed', { detail: { ...state } }));
    }
  } catch (e) { }

  return { ...state };
}

function scheduleProcessing(delay = 0) {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  retryTimer = setTimeout(() => {
    void processUploadQueue();
  }, delay);
}

function getRetryDelayMs(attempts = 1) {
  if (attempts >= MAX_RETRY_ATTEMPTS) return -1; // Stop retrying

  // Exponential backoff with full jitter (AWS recommended strategy)
  // baseDelay * 2^(attempt-1), capped at 5 min, then random(0, cap)
  const BASE_DELAY = 1000; // 1 second
  const MAX_DELAY = 5 * 60 * 1000; // 5 minutes

  const exponential = Math.min(BASE_DELAY * Math.pow(2, attempts - 1), MAX_DELAY);

  // Full jitter: random value between 0 and the exponential window
  return Math.floor(Math.random() * exponential);
}

async function ensureListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;

  window.addEventListener('online', () => {
    state.online = true;
    void refreshState();
    scheduleProcessing(0);
  });

  window.addEventListener('offline', () => {
    state.online = false;
    void refreshState();
  });

  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleProcessing(0);
    }
  });
}

function buildRemotePayload(sample: any, storagePath: string) {
  const uploadedAt = nowIso();
  return {
    client_sample_id: sample.clientSampleId,
    contributor_id: sample.contributorId,
    contributor_name: sample.contributorName,
    session_id: sample.sessionId,
    mode: sample.mode,
    character_id: sample.characterId,
    character_text: sample.character,
    sample_number: sample.sampleNumber,
    filename: sample.filename,
    storage_bucket: STORAGE_BUCKET,
    storage_path: storagePath,
    blob_bytes: sample.blobBytes,
    mime_type: sample.mimeType || 'image/png',
    upload_status: 'uploaded',
    retry_count: sample.uploadAttempts || 0,
    metadata: {
      contributorId: sample.contributorId,
      contributorName: sample.contributorName,
      sessionId: sample.sessionId,
      mode: sample.mode,
      characterId: sample.characterId,
      character: sample.character,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      createdAt: sample.timestamp,
    },
    created_at: sample.timestamp,
    uploaded_at: uploadedAt,
  };
}

async function upsertRemoteMetadata(client: any, sample: any, storagePath: string) {
  const contributorResult = await client.from('lipy_contributors').upsert(
    {
      contributor_id: sample.contributorId,
      contributor_name: sample.contributorName,
      last_seen_at: nowIso(),
    },
    { onConflict: 'contributor_id' },
  );
  if (contributorResult.error) throw contributorResult.error;

  const sessionResult = await client.from('lipy_sessions').upsert(
    {
      contributor_id: sample.contributorId,
      session_id: sample.sessionId,
      mode: sample.mode,
      started_at: sample.createdAt || sample.timestamp,
      updated_at: nowIso(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    },
    { onConflict: 'contributor_id,session_id' },
  );
  if (sessionResult.error) throw sessionResult.error;

  const sampleResult = await client.from('lipy_samples').upsert(buildRemotePayload(sample, storagePath), {
    onConflict: 'client_sample_id',
  });
  if (sampleResult.error) throw sampleResult.error;
}

function validateSampleForSync(sample: any, imageBlob: Blob) {
  if (!sample) return 'Missing sample payload';
  if (!sample.clientSampleId) return 'Missing client sample id';
  if (!isValidContributorName(sample.contributorName)) return 'Invalid contributor name';
  if (!sample.contributorId) return 'Missing contributor id';
  if (!ensureValidSessionId(sample.sessionId)) return 'Invalid session id';
  if (!isValidMode(sample.mode)) return 'Invalid collection mode';
  if (!characterIds.has(sample.characterId)) return 'Unknown character';
  if (!imageBlob || typeof imageBlob.size !== 'number') return 'Missing image blob';
  if (imageBlob.size <= 0) return 'Empty image blob';
  if (imageBlob.size > MAX_BLOB_BYTES) return 'Image exceeds upload limit';
  return '';
}

export async function queueSampleUpload(sampleRecord: SampleRecord, imageBlob: Blob) {
  const validationError = validateSampleForSync(sampleRecord, imageBlob);
  if (validationError) {
    if (sampleRecord.id) {
      await updateSampleSyncState(sampleRecord.id, {
        syncStatus: 'pending',
        uploadStatus: 'pending',
        uploadError: validationError,
      });
    }
    await refreshState({ lastError: validationError });
    return { ok: false, error: validationError };
  }

  const storagePath = sampleRecord.storagePath || buildStoragePath(sampleRecord);
  const timestamp = nowIso();
  const queuedSample = {
    ...sampleRecord,
    storagePath,
    blobBytes: imageBlob.size,
    mimeType: imageBlob.type || 'image/png',
    syncStatus: 'pending' as const,
    uploadStatus: 'pending' as const,
    uploadAttempts: sampleRecord.uploadAttempts || 0,
    uploadError: '',
    uploadedAt: null,
    updatedAt: timestamp,
  };

  await db.transaction('rw', db.samples, db.uploadQueue, async () => {
    if (sampleRecord.id) {
      await db.samples.update(sampleRecord.id, queuedSample);
    }
    await db.uploadQueue.put({
      clientSampleId: queuedSample.clientSampleId,
      sampleId: queuedSample.id,
      contributorId: queuedSample.contributorId,
      contributorName: queuedSample.contributorName,
      sessionId: queuedSample.sessionId,
      mode: queuedSample.mode,
      characterId: queuedSample.characterId,
      character: queuedSample.character,
      sampleNumber: queuedSample.sampleNumber,
      filename: queuedSample.filename,
      timestamp: queuedSample.timestamp,
      createdAt: queuedSample.createdAt || queuedSample.timestamp,
      updatedAt: timestamp,
      status: 'pending',
      attempts: queuedSample.uploadAttempts || 0,
      nextAttemptAt: timestamp,
      lastError: '',
      storagePath,
      blob: imageBlob,
      blobBytes: imageBlob.size,
      mimeType: imageBlob.type || 'image/png',
    });
  });

  void refreshState();
  scheduleProcessing(0);
  return { ok: true, storagePath };
}

async function markUploaded(item: any) {
  const uploadedAt = nowIso();
  if (item.sampleId) {
    await db.samples.update(item.sampleId, {
      syncStatus: 'uploaded',
      uploadStatus: 'uploaded',
      uploadAttempts: item.attempts || 0,
      uploadError: '',
      uploadedAt,
      storagePath: item.storagePath,
      updatedAt: uploadedAt,
    });
  }
  await db.uploadQueue.delete(item.clientSampleId);

  // Increment the lifetime contribution count only after a successful upload.
  // This ensures the lifetime stat reflects *synchronized* samples, not just
  // locally-saved ones, and survives across sessions.
  if (item?.contributorId) {
    try {
      incrementLifetimeCount(item.contributorId);
    } catch (e) { }
  }
}

async function markFailed(item: any, error: any) {
  const err = error as Error;
  const message = err?.message || String(error || 'Upload failed');
  const isRejection = message === REJECTED_MARKER;
  const isVerificationFailure = message === VERIFICATION_FAILED_MARKER;

  // Rejected entries are discarded immediately — no retries
  if (isRejection) {
    await db.uploadQueue.delete(item.clientSampleId);
    if (item.sampleId) {
      await updateSampleSyncState(item.sampleId, {
        syncStatus: 'pending',
        uploadStatus: 'failed',
        uploadAttempts: (item.attempts || 0) + 1,
        uploadError: 'Rejected',
      });
    }
    await refreshState({ lastError: REJECTED_MARKER, syncing: false });
    return;
  }

  // Verification failures (model couldn't verify) are NOT discarded.
  // The sample stays in local storage with a "verification_failed" status.
  // This allows:
  //   1. The user to see which samples failed verification
  //   2. Future re-verification if the model improves
  //   3. Manual review by admins
  //
  // Remove from upload queue (no retry), but keep in samples table.
  if (isVerificationFailure) {
    await db.uploadQueue.delete(item.clientSampleId);
    if (item.sampleId) {
      await updateSampleSyncState(item.sampleId, {
        syncStatus: 'verification_failed',
        uploadStatus: 'failed',
        uploadAttempts: (item.attempts || 0) + 1,
        uploadError: 'Verification failed — model could not verify the character',
      });
    }
    await refreshState({ lastError: VERIFICATION_FAILED_MARKER, syncing: false });
    return;
  }

  const attempts = (item.attempts || 0) + 1;
  const delay = getRetryDelayMs(attempts);

  // Mark as dead if max retries exceeded, then remove from queue
  if (delay === -1 || attempts >= MAX_RETRY_ATTEMPTS) {
    await db.uploadQueue.delete(item.clientSampleId);
    if (item.sampleId) {
      await updateSampleSyncState(item.sampleId, {
        syncStatus: 'pending',
        uploadStatus: 'failed',
        uploadAttempts: attempts,
        uploadError: message,
      });
    }
    return;
  }

  const nextAttemptAt = new Date(Date.now() + delay).toISOString();

  await db.uploadQueue.update(item.clientSampleId, {
    attempts,
    lastError: message,
    status: 'retrying',
    nextAttemptAt,
    updatedAt: nowIso(),
  });

  if (item.sampleId) {
    await updateSampleSyncState(item.sampleId, {
      syncStatus: 'pending',
      uploadStatus: 'retrying',
      uploadAttempts: attempts,
      uploadError: message,
    });
  }

  await refreshState({ lastError: message, syncing: false });
}

/**
 * Schedule the next processing run based on the earliest pending item's retry time.
 * Scans the upload queue for the minimum nextAttemptAt and sets a timer.
 */
async function scheduleNextProcessing() {
  const items = await db.uploadQueue.toArray();
  const eligible = items
    .filter((item) => item.status !== 'dead')
    .map((item) => new Date(item.nextAttemptAt || item.createdAt || 0).getTime())
    .filter((t) => t > 0);

  if (!eligible.length) return;

  const now = Date.now();
  const earliest = Math.min(...eligible);
  const delay = Math.max(0, earliest - now);

  scheduleProcessing(delay);
}

/**
 * Upload a single item via the verification API (server-side validation + storage).
 * Falls back to direct Supabase upload if the API is not configured.
 */
async function uploadSingleItem(client: any, item: any) {
  // If verification API is configured, route through it for server-side validation
  if (isVerificationApiConfigured()) {
    await uploadViaVerificationApi(item);
    return;
  }

  // Fallback: direct upload to Supabase (legacy path)
  const uploadResult = await client.storage.from(STORAGE_BUCKET).upload(item.storagePath, item.blob, {
    contentType: item.mimeType || 'image/png',
    upsert: true,
  });
  if (uploadResult.error) throw uploadResult.error;

  await upsertRemoteMetadata(client, item, item.storagePath);
}

/**
 * Upload a sample through the verification API endpoint.
 * The API handles model prediction, confidence check, character matching,
 * ban detection, and Supabase storage/database operations.
 *
 * This is the preferred path when the verification API is configured.
 *
 * On rejection: throws VERIFICATION_FAILED_MARKER so the queue handler
 * keeps the sample locally instead of discarding it entirely. On network
 * errors: throws the original error so the queue can retry.
 */
async function uploadViaVerificationApi(item: any) {
  const apiUrl = getVerificationApiUrl();

  // Convert the blob to base64 for JSON transport
  const imageBase64 = await blobToBase64(item.blob);

  const payload = {
    image: imageBase64,
    mimeType: item.mimeType || 'image/png',
    expectedCharacterId: item.characterId,
    expectedCharacter: item.character,
    contributorId: item.contributorId,
    contributorName: item.contributorName,
    sessionId: item.sessionId,
    mode: item.mode,
    clientSampleId: item.clientSampleId,
    sampleNumber: item.sampleNumber,
    filename: item.filename,
    timestamp: item.timestamp,
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Server-side error (5xx) — retryable, not a verification failure
    throw new Error(`Verification API returned status ${response.status}`);
  }

  const result = await response.json();

  if (!result.accepted) {
    // Verification rejected the sample. Use VERIFICATION_FAILED_MARKER
    // so the queue keeps the sample locally rather than discarding it.
    throw new Error(VERIFICATION_FAILED_MARKER);
  }

  // Sample was accepted — it's now stored in Supabase with status "verified"
  return result;
}

async function getOrderedQueueItems() {
  const items = await db.uploadQueue.toArray();
  return items.sort((left, right) => {
    const leftTime = new Date(left.createdAt || left.timestamp || left.updatedAt || 0).getTime();
    const rightTime = new Date(right.createdAt || right.timestamp || right.updatedAt || 0).getTime();
    return leftTime - rightTime;
  });
}

export async function processUploadQueue() {
  if (processingPromise) return processingPromise;

  processingPromise = (async () => {
    await ensureListeners();
    const client = getSupabaseClient();

    if (!client) {
      await refreshState({ syncing: false, lastError: 'Supabase is not configured' });
      return;
    }

    if (!getCurrentOnlineState()) {
      await refreshState({ syncing: false });
      return;
    }

    const queueItems = await getOrderedQueueItems();
    if (!queueItems.length) {
      await refreshState({ syncing: false, lastError: '' });
      return;
    }

    await refreshState({ syncing: true, lastError: '' });

    let uploadedCount = 0;
    let failedCount = 0;
    let firstError = '';

    for (const item of queueItems) {
      if (!getCurrentOnlineState()) break;

      // Skip dead items (exceeded max retries)
      if (item.status === 'dead') continue;

      const nextAttempt = item.nextAttemptAt ? new Date(item.nextAttemptAt).getTime() : 0;
      if (nextAttempt && nextAttempt > Date.now()) continue;

      // Use lower max retries for API-verified submissions to avoid
      // re-sending rejected samples indefinitely
      const maxRetries = isVerificationApiConfigured()
        ? VERIFICATION_API_MAX_RETRIES
        : MAX_RETRY_ATTEMPTS;

      if (item.attempts >= maxRetries) {
        await db.uploadQueue.delete(item.clientSampleId);
        if (item.sampleId) {
          await updateSampleSyncState(item.sampleId, {
            syncStatus: 'pending',
            uploadStatus: 'failed',
            uploadAttempts: item.attempts,
            uploadError: 'Submission rejected after max retries',
          });
        }
        continue;
      }

      try {
        await uploadSingleItem(client, item);
        await markUploaded(item);
        uploadedCount++;
      } catch (error) {
        failedCount++;
        const err = error as Error;
        const message = err?.message || String(error || 'Upload failed');
        if (!firstError) firstError = message;
        await markFailed(item, error);
        // Continue with the next item instead of bailing out
      }
    }

    await refreshState({ syncing: false, lastError: firstError, uploadedCount, failedCount });

    // Schedule next check based on the earliest remaining retry time
    await scheduleNextProcessing();
  })().finally(async () => {
    processingPromise = null;
    await refreshState({ syncing: false });
  });

  return processingPromise;
}

export function subscribeSyncState(listener: Function) {
  listeners.add(listener);
  ensureListeners().catch(() => { });
  void refreshState();
  listener({ ...state });

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Re-queue a verification-failed sample for another verification attempt.
 * Resets the attempt count so the queue processor picks it up fresh.
 * Returns the new queue status or null if the sample could not be found.
 */
export async function reverifySample(
  sample: SampleRecord,
  imageBlob?: Blob,
): Promise<{ ok: boolean; error?: string }> {
  if (!sample || !sample.clientSampleId) {
    return { ok: false, error: 'Invalid sample record' };
  }

  const blob = imageBlob || sample.imageBlob;
  if (!blob) {
    return { ok: false, error: 'No image data available for this sample' };
  }

  // Reset sync status to 'pending' so the upload queue picks it up
  if (sample.id) {
    await updateSampleSyncState(sample.id, {
      syncStatus: 'pending',
      uploadStatus: 'pending',
      uploadAttempts: 0,
      uploadError: '',
    });
  }

  // Re-queue for upload (which goes through verification)
  const result = await queueSampleUpload(sample, blob);

  if (result.ok) {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lipy:samples-updated'));
      }
    } catch (e) { }
  }

  return result;
}

/**
 * Permanently removes a verification-failed sample from local storage.
 * The contributor chose to discard it rather than retry.
 */
export async function clearFailedSample(sampleId: number): Promise<boolean> {
  if (!sampleId) return false;
  try {
    const result = await deleteSample(sampleId);
    if (result) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lipy:samples-updated'));
      }
    }
    return result;
  } catch {
    return false;
  }
}

/**
 * Batch re-verify all verification-failed samples for a contributor.
 * Runs automatically on startup and respects per-sample retry limits
 * tracked in localStorage to avoid infinite re-verify loops.
 *
 * @returns Stats about how many samples were re-queued for verification.
 */
export async function batchReverifyAllFailed(
  contributorId: string,
): Promise<{ reQueued: number; skipped: number; total: number }> {
  const result = { reQueued: 0, skipped: 0, total: 0 };

  if (!contributorId) return result;

  try {
    const samples = await getVerificationFailedSamples(contributorId);
    result.total = samples.length;

    if (!samples.length) return result;

    for (const sample of samples) {
      const sid = sample.id;
      if (sid == null) {
        result.skipped++;
        continue;
      }

      // Check how many auto-reverify attempts this sample has had
      const key = getAutoVerifyKey(contributorId, sample.clientSampleId);
      let attempts = 0;
      try {
        attempts = Number(localStorage.getItem(key) || 0) || 0;
      } catch { /* localStorage unavailable */ }

      if (attempts >= MAX_AUTO_VERIFY_ATTEMPTS) {
        result.skipped++;
        continue;
      }

      // Re-queue for verification
      const verifyResult = await reverifySample(sample);

      if (verifyResult.ok) {
        // Increment auto-reverify counter
        try {
          localStorage.setItem(key, String(attempts + 1));
        } catch { /* localStorage unavailable */ }
        result.reQueued++;
      } else {
        result.skipped++;
      }
    }
  } catch {
    // Failed to auto-reverify — non-critical, user can manually retry
  }

  return result;
}

export async function bootDatasetSync() {
  await ensureListeners();
  await refreshState();
  scheduleProcessing(0);
}
