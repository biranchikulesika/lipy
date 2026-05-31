"use client";

import type { ReactNode } from "react";

type ModalPanelProps = {
	title: string;
	onClose: () => void;
	children: ReactNode;
};

export function ModalPanel({ title, onClose, children }: ModalPanelProps) {
	return (
		<div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-3 py-6 backdrop-blur-sm sm:px-4 sm:py-8">
			<div className="panel relative w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-5 shadow-2xl sm:p-6">
				<div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">LiPi project</p>
						<h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10"
					>
						Close
					</button>
				</div>

				<div className="mt-5">{children}</div>
			</div>
		</div>
	);
}