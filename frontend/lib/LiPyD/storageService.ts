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
  uploadStatus?: 'pending' | 'retrying' | 'uploaded';
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
  try {
    const devKey = `lipy_device_sample_count_${record.contributorId}`;
    const sessKey = `lipy_session_sample_count_${record.contributorId}_${record.sessionId}`;
    try {
      const prevDev = Number(localStorage.getItem(devKey) || 0) || 0;
      localStorage.setItem(devKey, String(prevDev + 1));
    } catch (e) { }
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

export default db;
