import type { PredictionResponse } from "@/lib/types";

interface PredictionCardProps {
  prediction: PredictionResponse | null;
  loading?: boolean;
  error?: string | null;
}

export function PredictionCard({ prediction, loading = false, error = null }: PredictionCardProps) {
  return (
    <section className="panel rounded-[2rem] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Prediction</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-slate-950 dark:text-white">Model output</h2>
        </div>
        {loading ? (
          <span className="rounded-full border border-slate-900/10 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:text-slate-300">
            Running inference
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      {!error && !prediction ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-900/10 bg-slate-50/70 p-5 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Predictions will appear here after an image is uploaded, captured, or drawn.
        </div>
      ) : null}

      {prediction ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Predicted label</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <p className="font-mono text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {prediction.prediction}
              </p>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-medium text-white dark:bg-white dark:text-slate-950">
                {(prediction.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Confidence</span>
                <span>{(prediction.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-slate-900 dark:bg-white"
                  style={{ width: `${Math.max(3, prediction.confidence * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {loading ? null : <p className="text-sm text-slate-500 dark:text-slate-400">Top 3 predictions are shown below.</p>}
        </div>
      ) : null}
    </section>
  );
}
