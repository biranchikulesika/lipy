"use client";

import type { ReactNode } from "react";

interface InputWorkspaceProps {
	children: ReactNode;
	helperText?: string | null;
	helperVisible?: boolean;
	error?: string | null;
	onClear: () => void;
	onPredict: () => void;
	isPredicting: boolean;
	canPredict: boolean;
}

export function InputWorkspace({
	children,
	helperText,
	helperVisible = true,
	error,
	onClear,
	onPredict,
	isPredicting,
	canPredict,
}: InputWorkspaceProps) {
	return (
		<div className="flex h-full min-h-0 w-full flex-col items-center justify-center pt-2 sm:pt-4 pb-2">
			<div className="relative flex aspect-square w-full max-w-[344px] items-center justify-center overflow-hidden rounded-xl border border-slate-900/15 bg-white/90 transition dark:border-white/15 dark:bg-black/20">
				{children}
			</div>

			<div
				className={`mt-3 w-full max-w-[344px] px-2 text-center transition-opacity duration-200 ${
					helperVisible ? "opacity-100" : "opacity-0"
				}`}
			>
				<p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
					{helperText}
				</p>
			</div>

			<div className="relative mx-auto w-full max-w-[344px]">
				{error ? (
					<div
						role="status"
						aria-live="polite"
						className="pointer-events-none absolute inset-x-0 top-[-0.25rem] z-10 -translate-y-full max-h-auto overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-sm leading-snug text-amber-800 shadow-sm dark:text-amber-200"
					>
						<span className="font-semibold block mb-0.5">Please try again</span>
						{error}
					</div>
				) : null}
			</div>

			<div className="mt-3 flex w-full max-w-[344px] items-center gap-2">
				<button
					type="button"
					className="secondary-button flex-1 px-3 py-2 text-xs sm:text-sm"
					onClick={onClear}
					disabled={isPredicting}
				>
					Clear
				</button>

				<button
					type="button"
					className="primary-button flex-1 px-3 py-2 text-xs sm:px-4 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50"
					onClick={onPredict}
					disabled={isPredicting || !canPredict}
				>
					Predict
				</button>
			</div>
		</div>
	);
}
