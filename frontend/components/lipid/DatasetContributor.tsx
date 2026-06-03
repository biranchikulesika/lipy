"use client";

import { CONTRIBUTION_STEPS } from "@/constants/lipi";

export function DatasetContributor() {
	return (
		<main className="relative mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-[1500px] flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 lg:h-[calc(100vh-4.25rem)] lg:overflow-hidden lg:px-5 lg:pb-4">
			<section className="panel flex min-h-0 flex-1 flex-col rounded-xl p-4 sm:p-5">
				<div className="border-b border-slate-900/8 pb-3 dark:border-white/10">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">LiPiD</p>
					<h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Dataset Contributor</h1>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">A focused workspace for preparing, validating, and contributing Odia handwritten character samples to the LiPi dataset.</p>
				</div>

				<div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Contribution Workflow</p>
						<div className="mt-3 space-y-2">
							{CONTRIBUTION_STEPS.map((step, index) => (
								<div key={step} className="flex items-start gap-3 rounded-lg border border-slate-900/8 bg-slate-50/80 px-3 py-2 dark:border-white/10 dark:bg-white/5">
									<span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-200 dark:text-slate-950">{index + 1}</span>
									<p className="min-w-0 text-sm leading-6 text-slate-700 dark:text-slate-200">{step}</p>
								</div>
							))}
						</div>
					</section>

					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Dataset Notes</p>
						<div className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
							<p>Folders are grouped by label class so contributors can match samples to the model taxonomy quickly.</p>
							<p>Keep each image tightly cropped around one character to reduce preprocessing noise and improve consistency.</p>
							<p>Use the same export settings across batches for cleaner review and training throughput.</p>
						</div>
					</section>
				</div>
			</section>
		</main>
	);
}
