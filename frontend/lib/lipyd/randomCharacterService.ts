import { odiaCharacters, OdiaCharacter } from './odiaCharacters';
import { getAllSamples, getLifetimeCount, getContributorSampleCount } from './storageService';

const STATE_VERSION = 1;
const STORAGE_PREFIX = 'lipy_scheduler_v2_';
const QUEUE_SIZE = 24;

const FALLBACK_CHARACTER = odiaCharacters[0] || null;
const CHARACTER_BY_ID = new Map<string, OdiaCharacter>(odiaCharacters.map((character) => [character.id, character]));
const SESSION_STATE_CACHE = new Map<string, any>();
const SESSION_LOAD_PROMISES = new Map<string, Promise<any>>();

function nowIso(): string {
  return new Date().toISOString();
}

/** Fisher-Yates shuffle — every character has equal probability. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getSessionKey(sessionConfig: any): string {
  const contributorId = String(sessionConfig?.contributorId || 'anonymous');
  const sessionId = String(sessionConfig?.sessionId || 'S01');
  return `${contributorId}__${sessionId}`;
}

function getStorageKey(sessionKey: string): string {
  return `${STORAGE_PREFIX}${sessionKey}`;
}

function createEmptyState(sessionKey: string) {
  return {
    version: STATE_VERSION,
    sessionKey,
    queue: [] as string[],
    activeCharacterId: '',
    completedCount: 0,
    skippedCount: 0,
    datasetCounts: {} as Record<string, number>,
    updatedAt: nowIso(),
  };
}

function normalizeState(sessionKey: string, rawState: any = {}) {
  const state = createEmptyState(sessionKey);
  const merged = { ...state, ...rawState };

  merged.queue = Array.isArray(merged.queue) ? merged.queue.filter((id: string) => CHARACTER_BY_ID.has(id)) : [];
  merged.activeCharacterId = CHARACTER_BY_ID.has(merged.activeCharacterId) ? merged.activeCharacterId : '';
  merged.completedCount = Number.isFinite(Number(merged.completedCount)) ? Number(merged.completedCount) : 0;
  merged.skippedCount = Number.isFinite(Number(merged.skippedCount)) ? Number(merged.skippedCount) : 0;
  merged.updatedAt = merged.updatedAt || nowIso();

  return merged;
}

function readStoredState(sessionKey: string) {
  try {
    const raw = localStorage.getItem(getStorageKey(sessionKey));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStoredState(sessionKey: string, state: any) {
  try {
    localStorage.setItem(getStorageKey(sessionKey), JSON.stringify(state));
  } catch { /* localStorage unavailable */ }
}

function emitStateChange(state: any) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lipy:scheduler-state-changed', { detail: getPublicState(state) }));
    }
  } catch { /* noop */ }
}

/**
 * Build a balanced queue where under-represented character classes
 * get more slots, promoting a balanced dataset.
 *
 * Characters below the balanced target (total / numClasses) receive
 * extra slots proportional to how far below they are, up to 3 extra
 * slots maximum. Characters at or above target get 1 slot.
 *
 * All slots are shuffled so the order remains unpredictable.
 */
function buildQueue(datasetCounts: Record<string, number> = {}): string[] {
  const counts = Object.values(datasetCounts);
  const totalSamples = counts.reduce((sum, c) => sum + c, 0);
  const numClasses = odiaCharacters.length;
  const target = totalSamples > 0 && numClasses > 0
    ? Math.ceil(totalSamples / numClasses)
    : 0;

  const pool: string[] = [];

  for (const char of odiaCharacters) {
    const count = datasetCounts[char.id] || 0;
    // Base: every character gets at least 1 slot
    let slots = 1;

    // Boost: characters below target get extra slots
    if (target > 0 && count < target) {
      const deficit = target - count;
      // Map deficit to 1–3 extra slots (max boost when deficit >= half the target)
      const extra = Math.min(3, Math.ceil(deficit / Math.max(1, target / 2)));
      slots += extra;
    }

    for (let i = 0; i < slots; i++) {
      pool.push(char.id);
    }
  }

  return shuffle(pool).slice(0, QUEUE_SIZE);
}

function getPublicState(state: any) {
  return {
    sessionKey: state.sessionKey,
    completedCount: state.completedCount,
    skippedCount: state.skippedCount,
    activeCharacterId: state.activeCharacterId,
  };
}

function persistState(state: any) {
  state.updatedAt = nowIso();
  writeStoredState(state.sessionKey, state);
  SESSION_STATE_CACHE.set(state.sessionKey, state);
  emitStateChange(state);
}

async function loadSessionTotals(sessionConfig: any) {
  const samples = await getAllSamples();
  const datasetCounts: Record<string, number> = {};
  let contributorCompletedCount = 0;

  for (const sample of samples) {
    if (sample?.characterId) {
      datasetCounts[sample.characterId] = (datasetCounts[sample.characterId] || 0) + 1;
    }

    if (
      sample?.contributorId != null &&
      sessionConfig?.contributorId != null &&
      String(sample.contributorId).trim() === String(sessionConfig.contributorId).trim()
    ) {
      contributorCompletedCount += 1;
    }
  }

  const cachedLifetime = getLifetimeCount(sessionConfig?.contributorId || '');
  const dbCount = await getContributorSampleCount(sessionConfig?.contributorId || '');

  return {
    datasetCounts,
    contributorCompletedCount: Math.max(contributorCompletedCount, cachedLifetime, dbCount),
  };
}

async function ensureSessionState(sessionConfig: any) {
  const sessionKey = getSessionKey(sessionConfig);
  const cachedState = SESSION_STATE_CACHE.get(sessionKey);
  if (cachedState) return cachedState;

  const cachedPromise = SESSION_LOAD_PROMISES.get(sessionKey);
  if (cachedPromise) return cachedPromise;

  const promise = (async () => {
    const stored = readStoredState(sessionKey);
    const { datasetCounts, contributorCompletedCount } = await loadSessionTotals(sessionConfig);
    const state = normalizeState(sessionKey, stored || {});

    state.datasetCounts = datasetCounts;
    state.completedCount = Math.max(state.completedCount || 0, contributorCompletedCount);

    if (!state.queue.length && !state.activeCharacterId) {
      state.queue = buildQueue(state.datasetCounts);
    }

    persistState(state);
    return state;
  })();

  SESSION_LOAD_PROMISES.set(sessionKey, promise);
  try {
    const state = await promise;
    SESSION_STATE_CACHE.set(sessionKey, state);
    return state;
  } finally {
    SESSION_LOAD_PROMISES.delete(sessionKey);
  }
}

async function refillQueueIfNeeded(state: any) {
  if (state.queue.length >= Math.ceil(QUEUE_SIZE / 2)) return;

  // Build a fresh balanced batch and merge with existing queue (avoiding dupes)
  const freshQueue = buildQueue(state.datasetCounts || {});
  const existing = new Set(state.queue);
  existing.add(state.activeCharacterId);

  for (const id of freshQueue) {
    if (!existing.has(id)) {
      state.queue.push(id);
      existing.add(id);
    }
  }

  // If we still don't have enough, add leftovers (deduped from existing)
  if (state.queue.length < QUEUE_SIZE) {
    const leftovers = shuffle(
      odiaCharacters
        .filter((c) => !existing.has(c.id))
        .map((c) => c.id),
    );
    for (const id of leftovers) {
      state.queue.push(id);
    }
  }
}

export async function initializeScheduler(sessionConfig: any) {
  return ensureSessionState(sessionConfig);
}

export async function getNextCharacter(sessionConfig: any) {
  const state = await ensureSessionState(sessionConfig);
  if (state.activeCharacterId) {
    return CHARACTER_BY_ID.get(state.activeCharacterId) || FALLBACK_CHARACTER;
  }

  if (!state.queue.length) {
    state.queue = buildQueue(state.datasetCounts || {});
  }

  let nextCharacter: OdiaCharacter | null = null;
  while (!nextCharacter && state.queue.length > 0) {
    const nextId = state.queue.shift();
    if (nextId) {
      nextCharacter = CHARACTER_BY_ID.get(nextId) || null;
    }
  }

  if (!nextCharacter) {
    // Truly last resort — pick randomly
    nextCharacter = odiaCharacters[Math.floor(Math.random() * odiaCharacters.length)] || FALLBACK_CHARACTER;
  }

  if (nextCharacter) {
    state.activeCharacterId = nextCharacter.id;
    persistState(state);
  }

  return nextCharacter as OdiaCharacter;
}

export async function recordCharacterOutcome(sessionConfig: any, character: OdiaCharacter, outcome: string) {
  const state = await ensureSessionState(sessionConfig);
  const targetCharacter = character && CHARACTER_BY_ID.get(character.id) ? CHARACTER_BY_ID.get(character.id) : null;
  const isSingleMode = sessionConfig && sessionConfig.mode === 'single-character';
  if (!targetCharacter || (!isSingleMode && state.activeCharacterId !== targetCharacter.id)) {
    return getPublicState(state);
  }

  if (outcome === 'completed') {
    state.completedCount = (state.completedCount || 0) + 1;
    state.datasetCounts[targetCharacter.id] = (state.datasetCounts[targetCharacter.id] || 0) + 1;
  } else if (outcome === 'skipped') {
    state.skippedCount = (state.skippedCount || 0) + 1;
  }

  state.activeCharacterId = '';
  await refillQueueIfNeeded(state);
  persistState(state);

  return getPublicState(state);
}

export async function getSchedulerProgress(sessionConfig: any) {
  const state = await ensureSessionState(sessionConfig);
  return getPublicState(state);
}

export default {
  initializeScheduler,
  getNextCharacter,
  recordCharacterOutcome,
  getSchedulerProgress,
};
