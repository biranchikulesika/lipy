export const CONTRIBUTION_STEPS = [
  "Prepare centered single-character samples.",
  "Use PNG or JPEG and keep backgrounds clean.",
  "Match the label folders in the canonical dataset.",
  "Verify the crop before uploading a batch.",
];

// ─── Verification Configuration ───
// All values are configurable via environment variables with sensible defaults.

/**
 * Minimum confidence threshold for the LiPy recognition model.
 * Samples with confidence below this value are rejected.
 * Range: 0.0 to 1.0
 */
export const MIN_VERIFICATION_CONFIDENCE = Number(
  process.env.NEXT_PUBLIC_LIPY_MIN_CONFIDENCE || process.env.LIPY_MIN_CONFIDENCE || 0.90
);

/**
 * Maximum consecutive invalid submissions before a temporary ban is applied.
 */
export const MAX_INVALID_STREAK = Number(
  process.env.NEXT_PUBLIC_LIPY_MAX_INVALID_STREAK || process.env.LIPY_MAX_INVALID_STREAK || 4
);

/**
 * Duration (in hours) of a temporary ban after exceeding the invalid streak limit.
 */
export const TEMP_BAN_DURATION_HOURS = Number(
  process.env.NEXT_PUBLIC_LIPY_TEMP_BAN_HOURS || process.env.LIPY_TEMP_BAN_HOURS || 3
);

/**
 * Starting trust score for new contributors.
 * Each accepted submission adds +1 (capped at 100).
 * Each rejected submission deducts -5 (floored at 0).
 * Contributors are banned when trust_score falls below this threshold.
 */
export const TRUST_SCORE_INITIAL = 100;

export const TRUST_BAN_THRESHOLD = Number(
  process.env.NEXT_PUBLIC_LIPY_TRUST_THRESHOLD || process.env.LIPY_TRUST_THRESHOLD || 70
);

/** Trust score penalty applied per rejected submission. */
export const TRUST_PENALTY = -5;

// ─── Skip Verification Classes ───
// Characters in this set bypass the model verification pipeline entirely
// and are stored directly as 'unverified'. This is useful for classes the
// model isn't trained to recognise yet or for future dataset collection.
//
// To add classes, either:
//   1. Add the character ID (e.g. 'DIGIT_0') to the DEFAULT_SKIP set below
//   2. Set env LIPY_SKIP_VERIFICATION to a comma-separated list of IDs
//      (e.g. LIPY_SKIP_VERIFICATION="DIGIT_0,DIGIT_1,CONS_UNKNOWN")

let _skipCache: Set<string> | null = null;

function buildSkipSet(): Set<string> {
  const set = new Set<string>([
    // Digits — model is not yet capable of recognising these
    'DIGIT_0', 'DIGIT_1', 'DIGIT_2', 'DIGIT_3', 'DIGIT_4',
    'DIGIT_5', 'DIGIT_6', 'DIGIT_7', 'DIGIT_8', 'DIGIT_9',
  ]);

  // Allow extension via environment variable (comma-separated IDs)
  try {
    const envVal = typeof process !== 'undefined'
      ? (process.env.NEXT_PUBLIC_LIPY_SKIP_VERIFICATION || process.env.LIPY_SKIP_VERIFICATION || '')
      : '';
    if (envVal) {
      envVal.split(',').map((s) => s.trim()).filter(Boolean).forEach((id) => set.add(id));
    }
  } catch { /* env not available */ }

  return set;
}

/**
 * Returns the set of character IDs that should skip model verification.
 * Cached after first call.
 */
export function getSkipVerificationClasses(): Set<string> {
  if (!_skipCache) _skipCache = buildSkipSet();
  return _skipCache;
}

/**
 * Returns true if the given character ID should go through the full
 * model verification pipeline. Returns false for characters that should
 * skip verification and be stored as 'unverified'.
 */
export function shouldVerify(characterId: string): boolean {
  return !getSkipVerificationClasses().has(characterId);
}
