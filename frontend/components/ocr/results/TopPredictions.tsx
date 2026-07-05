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
        <div className="mt-5 space-y-4 opacity-50 select-none">
          {[
            { title: "Most likely character", desc: "Will show the highest confidence result" },
            { title: "Close matching alternative", desc: "Will show the second highest confidence result" },
            { title: "Another close matching", desc: "Will show the third highest confidence result" }
          ].map((ph, index) => (
            <div key={index} className="rounded-2xl border border-dashed border-verdigris-900/15 dark:border-white/10 bg-verdigris-50/20 p-4 dark:bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-semibold text-white dark:bg-slate-700 dark:text-slate-300">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{ph.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{ph.desc}</p>
                  </div>
                </div>
                <p className="font-mono text-sm font-semibold text-slate-400 dark:text-slate-500">--%</p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-verdigris-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-verdigris-200 dark:bg-slate-700" style={{ width: '0%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item, index) => {
            const confidence = Math.round(item.confidence * 1000) / 10;

            return (
              <div key={item.label + "-" + index} className="rounded-2xl border border-verdigris-900/10 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-verdigris-900 text-sm font-semibold text-white dark:bg-verdigris-200 dark:text-slate-950">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Ranked by softmax confidence</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{confidence.toFixed(1)}%</p>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-verdigris-200 dark:bg-white/10">
                  <div className="h-full rounded-full bg-verdigris-900 dark:bg-verdigris-200" style={{ width: `${Math.max(3, confidence)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
