export function Header() {
  return (
    <header className="panel rounded-[2rem] px-5 py-6 sm:px-7 sm:py-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Lipi</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Odia Handwriting Recognition System
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            Upload a handwritten Odia character, capture it with a camera, or draw it directly in the browser.
            The backend handles preprocessing and TensorFlow inference.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-900/10 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          FastAPI backend • TensorFlow inference • Render + Vercel
        </div>
      </div>
    </header>
  );
}
