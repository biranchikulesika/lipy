import db, { getPendingUploadCount, updateSampleSyncState, SampleRecord, incrementLifetimeCount } from './storageService';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { odiaCharacters } from './odiaCharacters';
import { ensureValidSessionId, isValidContributorName, isValidMode } from './validators';

const STORAGE_BUCKET = 'lipy-samples';
const MAX_BLOB_BYTES = 4 * 1024 * 1024;
const MAX_RETRY_ATTEMPTS = 10;
const characterIds = new Set(odiaCharacters.map((item) => item.id));

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

async function uploadSingleItem(client: any, item: any) {
  const uploadResult = await client.storage.from(STORAGE_BUCKET).upload(item.storagePath, item.blob, {
    contentType: item.mimeType || 'image/png',
    upsert: true,
  });
  if (uploadResult.error) throw uploadResult.error;

  await upsertRemoteMetadata(client, item, item.storagePath);
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

export async function bootDatasetSync() {
  await ensureListeners();
  await refreshState();
  scheduleProcessing(0);
}
