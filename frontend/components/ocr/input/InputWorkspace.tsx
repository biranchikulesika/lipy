"use client";

import type { ReactNode } from "react";
import { RotateCcw, Wand2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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
		<div className="flex h-full min-h-0 w-full flex-col items-center justify-start pt-2 sm:pt-4 pb-2">
			<div className="relative flex aspect-square w-full max-w-[344px] items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/20 transition">
				{children}
			</div>

			<div
				className={`mt-3 w-full max-w-[344px] px-2 text-center transition-opacity duration-200 ${
					helperVisible ? "opacity-100" : "opacity-0"
				}`}
			>
				<p className="text-sm leading-6 text-slate-300">
					{helperText}
				</p>
			</div>

			<div className="relative mx-auto w-full max-w-[344px] h-0">
				<AnimatePresence>
					{error && (
						<motion.div
							initial={{ opacity: 0, y: 10, scale: 0.95 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{ opacity: 0, y: 10, scale: 0.95 }}
							role="status"
							aria-live="polite"
							className="pointer-events-none absolute inset-x-0 bottom-2 z-20 flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-rose-400/20 bg-rose-950/95 px-4 py-3 text-center shadow-lg backdrop-blur-md"
						>
							<div className="flex items-center justify-center gap-2 mb-1 text-rose-400">
								<AlertCircle className="h-4 w-4" />
								<span className="font-bold text-sm">Action Failed</span>
							</div>
							<span className="text-xs font-medium text-rose-400/80">{error}</span>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className="mt-4 flex w-full max-w-[344px] items-center justify-center gap-4 sm:gap-6">
				<button
					type="button"
					className="group flex w-24 sm:w-28 h-12 sm:h-14 items-center justify-center rounded-2xl border border-white/10 bg-verdigris-950/80 shadow-sm backdrop-blur-sm transition-all hover:bg-verdigris-900 hover:shadow disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"
					onClick={onClear}
					disabled={isPredicting}
					aria-label="Clear Input"
					title="Clear Input"
				>
					<RotateCcw className="h-6 w-6 text-slate-400 transition-transform group-hover:-rotate-90" />
				</button>

				<button
					type="button"
					suppressHydrationWarning
					className="group flex w-24 sm:w-28 h-12 sm:h-14 items-center justify-center rounded-2xl bg-gradient-to-br from-verdigris-200 to-verdigris-300 shadow-md transition-all hover:from-white hover:to-verdigris-200 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] ring-1 ring-inset ring-white/10"
					onClick={onPredict}
					disabled={isPredicting || !canPredict}
					aria-label={isPredicting ? "Predicting..." : "Predict Character"}
					title={isPredicting ? "Predicting..." : "Predict Character"}
				>
					{isPredicting ? (
						<Loader2 className="h-6 w-6 text-slate-950 animate-spin" />
					) : (
						<Wand2 className="h-6 w-6 text-slate-950 transition-transform group-hover:scale-125" />
					)}
				</button>
			</div>
		</div>
	);
}
