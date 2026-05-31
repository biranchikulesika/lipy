"use client";

export function AboutPanel() {
	return (
		<main className="relative mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-[1500px] flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 lg:overflow-hidden lg:px-5 lg:pb-4">
			<section className="panel flex min-h-0 flex-1 flex-col rounded-xl p-4 sm:p-5">
				<div className="border-b border-slate-900/8 pb-3 dark:border-white/10">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">About</p>
					<h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">LiPi Project Overview</h1>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">A concise academic project page describing the goal, dataset, model, and implementation stack behind LiPi.</p>
				</div>

				<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Project Overview</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">LiPi is a university internship project for Odia handwritten character recognition with a focused OCR workflow.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Problem Statement</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Recognize isolated handwritten Odia characters reliably from draw, upload, or camera input.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Dataset Information</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Character folders cover consonants, vowels, and numerals, curated for single-character classification.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Model Architecture</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">A compact convolutional network processes preprocessed grayscale character crops and returns ranked predictions.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Technology Stack</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Next.js, Tailwind CSS, FastAPI, TensorFlow, and a lightweight image preprocessing pipeline.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Future Improvements</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Expand the training corpus, add confidence calibration, and support sentence-level Odia OCR.</p>
					</section>
				</div>
			</section>
		</main>
	);
}