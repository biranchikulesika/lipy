import type { PredictionResponse } from "@/lib/types";
import { getOdiaCharacter } from "@/lib/odiaCharacters";

interface PredictionCardProps {
  prediction: PredictionResponse | null;
  loading?: boolean;
  error?: string | null;
}

function formatConfidence(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function PredictionCard({
  prediction,
  loading = false,
  error = null,
}: PredictionCardProps) {
  const hasPrediction = Boolean(prediction);
  const topPredictions = prediction?.top_predictions.slice(0, 3) ?? [];

  return (
    <section className="relative flex min-h-0 flex-1 flex-col gap-3">
      {error ? (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 -translate-y-2 px-0 sm:-translate-y-3 sm:px-0">
          <div
            role="status"
            aria-live="polite"
            className="ml-auto max-w-full rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm leading-6 text-rose-200 shadow-lg backdrop-blur-sm"
            style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}
          >
            {error}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Detected Character</p>
          {loading ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Running</p> : null}
        </div>

        {hasPrediction ? (
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-slate-900/8 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-3xl font-semibold text-white dark:bg-white dark:text-slate-950 sm:h-20 sm:w-20 sm:text-4xl">
              {getOdiaCharacter(prediction!.prediction)}
            </div>
            <div className="min-w-0">
              <p className="lg:truncate font-mono text-sm font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">{prediction!.prediction}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">Model label mapped to the predicted Odia character.</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-slate-900/8 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            No prediction yet. Draw, upload, or capture a character to see the detected result.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Confidence</p>
          {loading ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Running</p> : null}
        </div>

        <div className="mt-3 flex items-end gap-3">
          <p className="font-mono text-3xl font-semibold leading-none text-slate-950 dark:text-white">
            {hasPrediction ? formatConfidence(prediction!.confidence) : "0.0%"}
          </p>
          <p className="pb-1 text-sm text-slate-600 dark:text-slate-300">
            {hasPrediction ? "Model confidence" : "Waiting for a prediction"}
          </p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-slate-900 dark:bg-white"
            style={{ width: hasPrediction ? `${Math.max(3, prediction!.confidence * 100)}%` : "12%" }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Top Predictions</p>
          {loading ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Running</p> : null}
        </div>

        <div className="mt-3 space-y-2">
          {(hasPrediction ? topPredictions : [
            { label: "Likely candidate", confidence: 0 },
            { label: "Secondary candidate", confidence: 0 },
            { label: "Fallback candidate", confidence: 0 },
          ]).map((item, index) => {
            const confidence = Math.round(item.confidence * 1000) / 10;
            const character = hasPrediction ? getOdiaCharacter(item.label) : "•";

            return (
            <div key={`${item.label}-${index}`} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-900/8 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-950">{index + 1}</span>
                <span className="font-display text-2xl leading-none text-slate-950 dark:text-white">{character}</span>
                <div className="min-w-0">
                  <p className="lg:truncate font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">{item.label}</p>
                </div>
                <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{hasPrediction ? `${confidence.toFixed(1)}%` : "—"}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
