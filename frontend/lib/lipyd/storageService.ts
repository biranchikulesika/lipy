import Dexie, { Table } from 'dexie';

export interface SampleRecord {
  id?: number;
  clientSampleId: string;
  characterId: string;
  character: string;
  contributorName: string;
  contributorId: string;
  sessionId: string;
  mode: string;
  sampleNumber: number;
  filename: string;
  timestamp: string;
  imageBlob: Blob;
  createdAt?: string;
  updatedAt?: string;
  syncStatus?: 'pending' | 'uploaded';
  uploadStatus?: 'pending' | 'retrying' | 'uploaded' | 'failed';
  uploadAttempts?: number;
  uploadError?: string;
  uploadedAt?: string | null;
  storagePath?: string;
  blobBytes?: number;
  mimeType?: string;
}

export interface ContributorRecord {
  id?: number;
  name: string;
  contributorId: string;
  sessionId: string;
  mode: string;
  started_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadQueueRecord {
  clientSampleId: string;
  sampleId?: number;
  contributorId: string;
  contributorName: string;
  sessionId: string;
  mode: string;
  characterId: string;
  character: string;
  sampleNumber: number;
  filename: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
  status: string;
  attempts: number;
  nextAttemptAt: string;
  lastError: string;
  storagePath: string;
  blob: Blob;
  blobBytes: number;
  mimeType: string;
}

export class LiPyDatabase extends Dexie {
  samples!: Table<SampleRecord, number>;
  contributors!: Table<ContributorRecord, number>;
  uploadQueue!: Table<UploadQueueRecord, string>;

  constructor() {
    super('LiPyDB');
    this.version(1).stores({ samples: '++id,characterId,filename,timestamp' });
    this.version(2).stores({ samples: '++id,characterId,filename,timestamp', contributors: '++id,contributorId,sessionId' });
    this.version(3).stores({
      samples: '++id,clientSampleId,characterId,contributorId,sessionId,filename,timestamp,syncStatus,uploadedAt',
      contributors: '++id,contributorId,sessionId',
      uploadQueue: 'clientSampleId,contributorId,sessionId,characterId,status,nextAttemptAt,updatedAt',
    });
    this.version(4).stores({
      samples: '++id,clientSampleId,characterId,contributorId,sessionId,filename,timestamp,syncStatus,uploadedAt,[characterId+contributorId+sessionId]',
      contributors: '++id,contributorId,sessionId,[contributorId+sessionId]',
      uploadQueue: 'clientSampleId,contributorId,sessionId,characterId,status,nextAttemptAt,updatedAt',
    });
    this.version(5).stores({
      samples: '++id,clientSampleId,characterId,contributorId,sessionId,filename,timestamp,syncStatus,uploadedAt,[characterId+contributorId+sessionId],[contributorId+syncStatus]',
      contributors: '++id,contributorId,sessionId,[contributorId+sessionId]',
      uploadQueue: 'clientSampleId,contributorId,sessionId,characterId,status,nextAttemptAt,updatedAt',
    });
  }
}

const db = new LiPyDatabase();

function nowIso() {
  return new Date().toISOString();
}

export async function saveSample(sample: Omit<SampleRecord, 'id'>) {
  const timestamp = sample?.timestamp || nowIso();
  const record: SampleRecord = {
    ...sample,
    timestamp,
    createdAt: sample?.createdAt || timestamp,
    updatedAt: nowIso(),
    syncStatus: sample?.syncStatus || 'pending',
    uploadStatus: sample?.uploadStatus || 'pending',
    uploadAttempts: sample?.uploadAttempts || 0,
    uploadError: sample?.uploadError || '',
    uploadedAt: sample?.uploadedAt || null,
  };
  const id = await db.samples.add(record);
  // Session statistics reset per session; lifetime statistics are incremented
  // only after a sample has been successfully synchronized (see
  // datasetSyncService.markUploaded -> incrementLifetimeCount).
  try {
    const sessKey = `lipy_session_sample_count_${record.contributorId}_${record.sessionId}`;
    try {
      const prevSess = Number(localStorage.getItem(sessKey) || 0) || 0;
      localStorage.setItem(sessKey, String(prevSess + 1));
    } catch (e) { }
  } catch (e) { }
  try {
    if (record && record.contributorId && record.sessionId && record.timestamp) {
      const key = `lipy_last_sample_ts_${record.contributorId}_${record.sessionId}`;
      try { localStorage.setItem(key, record.timestamp) } catch (e) { }
    }
  } catch (e) { }
  return { ...record, id };
}

export async function getAllSamples() {
  return await db.samples.orderBy('timestamp').toArray();
}

export async function saveContributor(contributor: Omit<ContributorRecord, 'id'>) {
  const next: ContributorRecord = {
    ...contributor,
    createdAt: contributor.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
  const existing = await db.contributors.where({ contributorId: next.contributorId, sessionId: next.sessionId }).first();
  if (existing && existing.id) {
    await db.contributors.update(existing.id, next);
    return existing.id;
  }
  return await db.contributors.add(next);
}

export async function countSamplesByKey(characterId: string, contributorId: string, sessionId: string) {
  return await db.samples.where({ characterId, contributorId, sessionId }).count();
}

export async function updateSampleSyncState(id: number, changes: Partial<SampleRecord> = {}) {
  if (!id) return null;
  const patch = {
    ...changes,
    updatedAt: nowIso(),
  };
  await db.samples.update(id, patch);
  return db.samples.get(id);
}

export async function getSampleById(id: number) {
  return db.samples.get(id);
}

export async function getPendingUploadCount() {
  return db.uploadQueue.count();
}

/**
 * Lifetime contribution count helpers.
 *
 * The lifetime count represents the total number of samples a contributor has
 * *synchronized* (uploaded) across all sessions. It is stored in localStorage
 * under `lipy_device_sample_count_{contributorId}` and is incremented only
 * after a successful upload (see datasetSyncService.markUploaded). This
 * ensures the count persists across sessions, only ever increases on sync,
 * and is cleared by Reset Profile or by clearing browser storage.
 */

export function getLifetimeCount(contributorId: string): number {
  if (!contributorId) return 0;
  try {
    const key = `lipy_device_sample_count_${String(contributorId).trim()}`;
    return Number(localStorage.getItem(key) || 0) || 0;
  } catch (e) {
    return 0;
  }
}

export function incrementLifetimeCount(contributorId: string): number {
  if (!contributorId) return 0;
  try {
    const key = `lipy_device_sample_count_${String(contributorId).trim()}`;
    const prev = Number(localStorage.getItem(key) || 0) || 0;
    const next = prev + 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch (e) {
    return 0;
  }
}

export function clearLifetimeCount(contributorId: string) {
  if (!contributorId) return;
  try {
    const key = `lipy_device_sample_count_${String(contributorId).trim()}`;
    localStorage.removeItem(key);
  } catch (e) { }
}

/**
 * Counts ALL samples in the local IndexedDB for a given contributor (across
 * all sessions, regardless of sync status).
 */
export async function getContributorSampleCount(contributorId: string): Promise<number> {
  if (!contributorId) return 0;
  try {
    const cid = String(contributorId).trim();
    return await db.samples.where('contributorId').equals(cid).count();
  } catch (e) {
    return 0;
  }
}

/**
 * Counts only *uploaded* samples in the local IndexedDB for a given
 * contributor (across all sessions).  Used to reconcile the displayed
 * lifetime contribution count so it reflects only successfully synchronized
 * samples.
 */
export async function getUploadedSampleCount(contributorId: string): Promise<number> {
  if (!contributorId) return 0;
  try {
    const cid = String(contributorId).trim();
    return await db.samples.where({ contributorId: cid, syncStatus: 'uploaded' }).count();
  } catch (e) {
    return 0;
  }
}

/**
 * Clears ALL local data associated with a contributor profile:
 * - Lifetime contribution count (localStorage)
 * - Session config (localStorage)
 * - Session sample counts (localStorage)
 * - Last-sample timestamps (localStorage)
 * - Scheduler state (localStorage)
 * - Sample counter keys (localStorage)
 * - IndexedDB samples, contributors, and uploadQueue tables
 *
 * After calling this the contributor profile is fully reset.
 */
export async function clearContributorData(contributorId: string) {
  if (!contributorId) return;
  const cid = String(contributorId).trim();

  // 1. Remove known localStorage keys for this contributor
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (
        k.startsWith(`lipy_device_sample_count_${cid}`) ||
        k.startsWith(`lipy_session_sample_count_${cid}`) ||
        k.startsWith(`lipy_sample_counter_${cid}`) ||
        k.startsWith(`lipy_last_sample_ts_${cid}`) ||
        k.startsWith(`lipy_last_export_ts_${cid}`) ||
        k.startsWith(`lipy_mixed_scheduler_state_v1_${cid}`)
      )) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) { }

  // 2. Remove session config (global, not contributor-scoped)
  try { localStorage.removeItem('lipy_session_config'); } catch (e) { }

  // 3. Clear IndexedDB tables for this contributor
  try {
    await db.transaction('rw', db.samples, db.contributors, db.uploadQueue, async () => {
      await db.samples.where('contributorId').equals(cid).delete();
      await db.contributors.where('contributorId').equals(cid).delete();
      await db.uploadQueue.where('contributorId').equals(cid).delete();
    });
  } catch (e) { }
}

export default db;
