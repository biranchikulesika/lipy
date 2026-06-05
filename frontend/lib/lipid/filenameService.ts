import { countSamplesByKey } from './storageService';

function shortRandomSuffix(length = 6): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

function isoTimestampSafe(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}${ms}`;
}

export async function generateFilename({ characterId, contributorId, sessionId = 'S01' }: { characterId: string, contributorId: string, sessionId?: string }) {
  let next = 0;
  try {
    const existing = await countSamplesByKey(characterId, contributorId, sessionId);
    next = existing + 1;
  } catch (e) {
    try {
      const key = `lipi_sample_counter_${contributorId}_${sessionId}_${characterId}`;
      const raw = localStorage.getItem(key) || '0';
      let n = parseInt(raw, 10) || 0;
      n = n + 1;
      try { localStorage.setItem(key, String(n)); } catch (err) {}
      next = n;
    } catch (err) {
      next = Date.now() % 100000;
    }
  }

  const sn = String(next).padStart(4, '0');
  const ts = isoTimestampSafe(new Date());
  const rand = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? crypto.randomUUID().split('-')[0]
    : shortRandomSuffix(8);

  const filename = `${characterId}_${contributorId}_${sessionId}_${sn}_${ts}_${rand}.png`;
  return { filename, sampleNumber: next };
}

export function generateSessionId(): string {
  try {
    const key = 'lipi_session_counter';
    const raw = localStorage.getItem(key) || '0';
    let n = parseInt(raw, 10) || 0;
    n = n + 1;
    localStorage.setItem(key, String(n));
    return 'S' + String(n).padStart(2, '0');
  } catch (e) {
    return 'S01';
  }
}
