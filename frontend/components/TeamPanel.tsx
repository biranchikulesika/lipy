"use client";

export function TeamPanel() {
	return (
		<main className="relative mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-[1500px] flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 lg:overflow-hidden lg:px-5 lg:pb-4">
			<section className="panel flex min-h-0 flex-1 flex-col rounded-xl p-4 sm:p-5">
				<div className="border-b border-slate-900/8 pb-3 dark:border-white/10">
					<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Team</p>
					<h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">LiPi Project Team</h1>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">A project showcase layout for the academic team, mentor, roles, and internship context.</p>
				</div>

				<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Faculty Mentor</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Academic supervisor guiding project direction, review, and evaluation.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Student Members</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Students responsible for data preparation, model training, API integration, and interface design.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Roles</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Research, dataset curation, frontend implementation, backend inference, and final presentation.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">University</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Project presented as part of an academic internship and applied machine learning initiative.</p>
					</section>
					<section className="rounded-xl border border-slate-900/8 bg-white/70 p-4 sm:col-span-2 xl:col-span-3 dark:border-white/10 dark:bg-white/5">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Internship Program</p>
						<p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">Industry-style academic internship focused on practical OCR delivery, model evaluation, and deployment-ready UI.</p>
					</section>
				</div>
			</section>
		</main>
	);
}