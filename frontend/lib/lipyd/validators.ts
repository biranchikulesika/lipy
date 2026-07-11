export function isValidContributorName(name: string | null | undefined): boolean {
  if (!name) return false;
  const s = String(name).trim();
  return s.length >= 2 && s.length <= 50;
}

export function isValidMode(mode: string | null | undefined): boolean {
  return mode === 'single-character' || mode === 'mixed-random';
}

export function ensureValidSessionId(sid: string | null | undefined): boolean {
  if (!sid) return false;
  return /^S\d{2,}$/.test(String(sid));
}
