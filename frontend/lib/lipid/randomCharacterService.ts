import { odiaCharacters, OdiaCharacter, CharacterType } from './odiaCharacters';
import { getAllSamples } from './storageService';

const STATE_VERSION = 1;
const STORAGE_PREFIX = 'lipi_mixed_scheduler_state_v1_';
const QUEUE_SIZE = 24;
const RECENT_LIMIT = 5;
const FATIGUE_WINDOW = 8;

const BASE_CATEGORY_WEIGHTS: Record<CharacterType, number> = {
  consonant: 0.58,
  vowel: 0.27,
  matra: 0.10,
  digit: 0.05,
};

const BASE_TYPE_WEIGHTS: Record<CharacterType, number> = {
  consonant: 1,
  vowel: 0.72,
  matra: 0.45,
  digit: 0.08,
};

const FALLBACK_CHARACTER = odiaCharacters[0] || null;
const CHARACTER_BY_ID = new Map<string, OdiaCharacter>(odiaCharacters.map((character) => [character.id, character]));
const SESSION_STATE_CACHE = new Map<string, any>();
const SESSION_LOAD_PROMISES = new Map<string, Promise<any>>();

function nowIso(): string {
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
    recentCharacterIds: [] as string[],
    recentOutcomes: [] as any[],
    charStats: {} as Record<string, any>,
    datasetCounts: {} as Record<string, number>,
    completedCount: 0,
    skippedCount: 0,
    totalShown: 0,
    totalDigitsShown: 0,
    lastRefillAt: 0,
    updatedAt: nowIso(),
  };
}

function normalizeState(sessionKey: string, rawState: any = {}) {
  const state = createEmptyState(sessionKey);
  const merged = {
    ...state,
    ...rawState,
  };

  merged.queue = Array.isArray(merged.queue) ? merged.queue.filter((id: string) => CHARACTER_BY_ID.has(id)) : [];
  merged.activeCharacterId = CHARACTER_BY_ID.has(merged.activeCharacterId) ? merged.activeCharacterId : '';
  merged.recentCharacterIds = Array.isArray(merged.recentCharacterIds)
    ? merged.recentCharacterIds.filter((id: string) => CHARACTER_BY_ID.has(id)).slice(-RECENT_LIMIT)
    : [];
  merged.recentOutcomes = Array.isArray(merged.recentOutcomes) ? merged.recentOutcomes.slice(-FATIGUE_WINDOW) : [];
  merged.charStats = typeof merged.charStats === 'object' && merged.charStats ? merged.charStats : {};
  merged.datasetCounts = typeof merged.datasetCounts === 'object' && merged.datasetCounts ? merged.datasetCounts : {};
  merged.completedCount = Number.isFinite(Number(merged.completedCount)) ? Number(merged.completedCount) : 0;
  merged.skippedCount = Number.isFinite(Number(merged.skippedCount)) ? Number(merged.skippedCount) : 0;
  merged.totalShown = Number.isFinite(Number(merged.totalShown)) ? Number(merged.totalShown) : 0;
  merged.totalDigitsShown = Number.isFinite(Number(merged.totalDigitsShown)) ? Number(merged.totalDigitsShown) : 0;
  merged.lastRefillAt = Number.isFinite(Number(merged.lastRefillAt)) ? Number(merged.lastRefillAt) : 0;
  merged.updatedAt = merged.updatedAt || nowIso();

  return merged;
}

function readStoredState(sessionKey: string) {
  try {
    const raw = localStorage.getItem(getStorageKey(sessionKey));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeStoredState(sessionKey: string, state: any) {
  try {
    localStorage.setItem(getStorageKey(sessionKey), JSON.stringify(state));
  } catch (e) { }
}

function emitStateChange(state: any) {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lipi:scheduler-state-changed', { detail: getPublicState(state) }));
    }
  } catch (e) { }
}

function getCharacterType(character: any): CharacterType {
  return character?.type || 'consonant';
}

function getCharStat(state: any, characterId: string) {
  if (!state.charStats[characterId]) {
    state.charStats[characterId] = {
      shown: 0,
      completed: 0,
      skipped: 0,
      skipStreak: 0,
      successStreak: 0,
      lastOutcome: '',
    };
  }
  return state.charStats[characterId];
}

function getCategoryCharacters(category: string) {
  return odiaCharacters.filter((character) => getCharacterType(character) === category);
}

function getCategoryTotals(datasetCounts: Record<string, number>) {
  const totals: Record<CharacterType, number> = {
    consonant: 0,
    vowel: 0,
    matra: 0,
    digit: 0,
  };

  for (const character of odiaCharacters) {
    const count = Number(datasetCounts?.[character.id] || 0);
    totals[getCharacterType(character)] += count;
  }

  return totals;
}

function getDatasetBalanceWeight(character: OdiaCharacter, datasetCounts: Record<string, number>) {
  const category = getCharacterType(character);
  const charactersInCategory = getCategoryCharacters(category);
  if (!charactersInCategory.length) return 1;

  const categoryTotals = getCategoryTotals(datasetCounts);
  const categoryAverage = categoryTotals[category] / charactersInCategory.length;
  if (!Number.isFinite(categoryAverage) || categoryAverage <= 0) return 1.15;

  const charCount = Number(datasetCounts?.[character.id] || 0);
  const ratio = charCount / categoryAverage;

  if (ratio < 1) {
    return clamp(1 + (1 - ratio) * 0.8, 1, 1.8);
  }

  return clamp(1 / (1 + (ratio - 1) * 0.7), 0.45, 1);
}

function getFatigueSnapshot(state: any) {
  const recent = state.recentOutcomes.slice(-FATIGUE_WINDOW);
  const skips = recent.filter((entry: any) => entry?.outcome === 'skipped').length;
  const skipRate = recent.length ? skips / recent.length : 0;
  const active = (skips >= 3 && skipRate >= 0.4) || (
    state.skippedCount >= 3 &&
    state.completedCount > 0 &&
    state.skippedCount / Math.max(1, state.completedCount + state.skippedCount) >= 0.4
  );

  return {
    active,
    intensity: clamp((skipRate - 0.35) / 0.35, 0, 1),
    skipRate,
  };
}

function getFatigueWeight(character: OdiaCharacter, state: any) {
  const fatigue = getFatigueSnapshot(state);
  if (!fatigue.active) return 1;

  const category = getCharacterType(character);
  if (category === 'digit') return clamp(0.15 + (1 - fatigue.intensity) * 0.1, 0.12, 0.25);
  if (category === 'matra') return clamp(0.45 + (1 - fatigue.intensity) * 0.15, 0.45, 0.6);
  if (category === 'vowel') return clamp(0.85 + (1 - fatigue.intensity) * 0.1, 0.85, 1);
  return clamp(1.05 + fatigue.intensity * 0.15, 1.05, 1.2);
}

function getRecentPenalty(characterId: string, recentCharacterIds: string[]) {
  const index = recentCharacterIds.lastIndexOf(characterId);
  if (index === -1) return 1;

  const distanceFromEnd = recentCharacterIds.length - 1 - index;
  if (distanceFromEnd <= 0) return 0;
  if (distanceFromEnd === 1) return 0.05;
  if (distanceFromEnd === 2) return 0.18;
  if (distanceFromEnd === 3) return 0.4;
  return 0.65;
}

function getPersonalizationWeight(character: OdiaCharacter, state: any) {
  const stat = getCharStat(state, character.id);
  const skipRate = stat.shown > 0 ? stat.skipped / stat.shown : 0;

  let weight = 1;
  weight *= clamp(1 - stat.skipStreak * 0.16, 0.35, 1);
  weight *= clamp(1 - skipRate * 0.35, 0.55, 1);
  weight *= clamp(1 + stat.successStreak * 0.04, 1, 1.15);

  return weight;
}

function getBaseTypeWeight(character: OdiaCharacter) {
  return BASE_TYPE_WEIGHTS[getCharacterType(character)] || 0.6;
}

function getCharacterWeight(character: OdiaCharacter, state: any) {
  const base = getBaseTypeWeight(character);
  const balance = getDatasetBalanceWeight(character, state.datasetCounts);
  const personalization = getPersonalizationWeight(character, state);
  const repetition = getRecentPenalty(character.id, state.recentCharacterIds);
  const fatigue = getFatigueWeight(character, state);

  return base * balance * personalization * repetition * fatigue;
}

function pickWeightedCandidate(candidates: { character: OdiaCharacter; weight: number }[]) {
  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return null;

  let roll = Math.random() * totalWeight;
  for (const item of candidates) {
    roll -= item.weight;
    if (roll <= 0) return item.character;
  }

  return candidates[candidates.length - 1]?.character || null;
}

function getCategoryTargets(state: any, queueSize = QUEUE_SIZE) {
  const targets: Record<CharacterType, number> = {
    consonant: 0,
    vowel: 0,
    matra: 0,
    digit: 0,
  };

  const fatigue = getFatigueSnapshot(state);
  const recentlyUsedDigit = state.recentCharacterIds.slice(-2).some((characterId: string) => getCharacterType(CHARACTER_BY_ID.get(characterId)) === 'digit');

  for (const [category, share] of Object.entries(BASE_CATEGORY_WEIGHTS)) {
    if (!getCategoryCharacters(category).length) continue;
    targets[category as CharacterType] = Math.floor(queueSize * share);
  }

  if (getCategoryCharacters('digit').length) {
    targets.digit = recentlyUsedDigit || fatigue.active ? 0 : Math.max(targets.digit, 1);
  }

  if (fatigue.active) {
    targets.matra = Math.max(0, targets.matra - 1);
    targets.vowel += 1;
    targets.consonant += 1;
  }

  let allocated = Object.values(targets).reduce((sum, value) => sum + value, 0);
  while (allocated < queueSize) {
    if (getCategoryCharacters('consonant').length) {
      targets.consonant += 1;
    } else if (getCategoryCharacters('vowel').length) {
      targets.vowel += 1;
    } else if (getCategoryCharacters('matra').length) {
      targets.matra += 1;
    } else if (getCategoryCharacters('digit').length) {
      targets.digit += 1;
    }
    allocated += 1;
  }

  while (allocated > queueSize) {
    const reductionOrder: CharacterType[] = ['digit', 'matra', 'vowel', 'consonant'];
    let reduced = false;
    for (const category of reductionOrder) {
      if (targets[category] > 0) {
        targets[category] -= 1;
        allocated -= 1;
        reduced = true;
        break;
      }
    }
    if (!reduced) break;
  }

  return targets;
}

function getCategoryPlan(state: any, queueSize = QUEUE_SIZE) {
  const targets = getCategoryTargets(state, queueSize);
  const plan: CharacterType[] = [];

  for (const [category, target] of Object.entries(targets)) {
    for (let i = 0; i < target; i += 1) {
      plan.push(category as CharacterType);
    }
  }

  for (let i = plan.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }

  return plan;
}

function getCandidatesForCategory(category: CharacterType, excludedIds = new Set<string>()) {
  return odiaCharacters.filter((character) => getCharacterType(character) === category && !excludedIds.has(character.id));
}

function buildQueue(state: any) {
  const queue: string[] = [];
  const excludedIds = new Set<string>(state.recentCharacterIds.slice(-RECENT_LIMIT));
  const categoryPlan = getCategoryPlan(state, QUEUE_SIZE);
  const availableIds = new Set<string>(odiaCharacters.map((character) => character.id));

  for (const category of categoryPlan) {
    let candidates = getCandidatesForCategory(category, excludedIds)
      .filter((character) => availableIds.has(character.id))
      .map((character) => ({ character, weight: getCharacterWeight(character, state) }))
      .filter((item) => item.weight > 0);

    if (!candidates.length) {
      candidates = odiaCharacters
        .filter((character) => availableIds.has(character.id) && !excludedIds.has(character.id))
        .map((character) => ({ character, weight: getCharacterWeight(character, state) }))
        .filter((item) => item.weight > 0);
    }

    if (!candidates.length) {
      candidates = odiaCharacters
        .filter((character) => availableIds.has(character.id))
        .map((character) => ({ character, weight: getCharacterWeight(character, state) }))
        .filter((item) => item.weight > 0);
    }

    const picked = pickWeightedCandidate(candidates);
    if (!picked) continue;

    queue.push(picked.id);
    availableIds.delete(picked.id);
    excludedIds.add(picked.id);
  }

  return queue;
}

function getFallbackCharacter(state: any) {
  const candidates = odiaCharacters.map((character) => ({ character, weight: getCharacterWeight(character, state) }));
  return pickWeightedCandidate(candidates) || FALLBACK_CHARACTER;
}

function getPublicState(state: any) {
  return {
    sessionKey: state.sessionKey,
    completedCount: state.completedCount,
    skippedCount: state.skippedCount,
    totalShown: state.totalShown,
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

  let cachedDev = 0;
  try {
    const devKey = `lipi_device_sample_count_${String(sessionConfig?.contributorId || '').trim()}`;
    cachedDev = Number(localStorage.getItem(devKey) || 0) || 0;
  } catch(e) {}
  
  return { datasetCounts, contributorCompletedCount: Math.max(contributorCompletedCount, cachedDev) };
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
      state.queue = buildQueue(state);
      state.lastRefillAt = Date.now();
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

  const refill = buildQueue(state);
  const existing = new Set(state.queue);
  for (const characterId of refill) {
    if (!existing.has(characterId as string) && characterId !== state.activeCharacterId) {
      state.queue.push(characterId);
      existing.add(characterId as string);
    }
  }

  state.lastRefillAt = Date.now();
}

function markCharacterShown(state: any, character: OdiaCharacter) {
  const stat = getCharStat(state, character.id);
  stat.shown += 1;
  stat.lastOutcome = 'shown';
  state.totalShown += 1;
  if (getCharacterType(character) === 'digit') {
    state.totalDigitsShown += 1;
  }
  state.recentCharacterIds.push(character.id);
  state.recentCharacterIds = state.recentCharacterIds.slice(-RECENT_LIMIT);
  state.activeCharacterId = character.id;
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
    state.queue = buildQueue(state);
    state.lastRefillAt = Date.now();
  }

  let nextCharacter = null;
  while (!nextCharacter && state.queue.length > 0) {
    const nextId = state.queue.shift();
    if (nextId) {
        nextCharacter = CHARACTER_BY_ID.get(nextId) || null;
    }
  }

  if (!nextCharacter) {
    nextCharacter = getFallbackCharacter(state);
  }

  if (nextCharacter) {
    markCharacterShown(state, nextCharacter as OdiaCharacter);
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

  const stat = getCharStat(state, targetCharacter.id);
  stat.lastOutcome = outcome;

  if (outcome === 'completed') {
    stat.completed += 1;
    stat.skipStreak = Math.max(0, stat.skipStreak - 1);
    stat.successStreak += 1;
    state.completedCount += 1;
    state.datasetCounts[targetCharacter.id] = (state.datasetCounts[targetCharacter.id] || 0) + 1;
  } else if (outcome === 'skipped') {
    stat.skipped += 1;
    stat.skipStreak += 1;
    stat.successStreak = 0;
    state.skippedCount += 1;
  }

  state.recentOutcomes.push({ characterId: targetCharacter.id, outcome, timestamp: nowIso() });
  state.recentOutcomes = state.recentOutcomes.slice(-FATIGUE_WINDOW);
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
