import type { PredictionItem } from "@/types/ocr";

interface TopPredictionsProps {
  items: PredictionItem[];
}

export function TopPredictions({ items }: TopPredictionsProps) {
  return (
    <section className="panel rounded-[2rem] p-5 sm:p-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Top 3</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-slate-950 dark:text-white">Prediction shortlist</h2>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-900/10 bg-slate-50/70 p-5 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          The three highest softmax scores will appear here after prediction.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item, index) => {
            const confidence = Math.round(item.confidence * 1000) / 10;

            return (
              <div key={item.label + "-" + index} className="rounded-2xl border border-slate-900/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white dark:bg-slate-200 dark:text-slate-950">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ranked by softmax confidence</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{confidence.toFixed(1)}%</p>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className="h-full rounded-full bg-slate-900 dark:bg-slate-200" style={{ width: `${Math.max(3, confidence)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
