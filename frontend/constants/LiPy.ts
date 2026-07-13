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
