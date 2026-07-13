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




