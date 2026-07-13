"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "motion/react";

import { PenLine, FileImage, Camera, MoreVertical } from "lucide-react";

import { PredictionCard } from "@/components/ocr/results/PredictionCard";
import { predictOdiaCharacter } from "@/lib/api";
import type { PredictionResponse } from "@/types/ocr";

import { InputWorkspace } from "@/components/ocr/input/InputWorkspace";
import { DrawContent } from "@/components/ocr/input/DrawMode";
import { UploadContent } from "@/components/ocr/input/UploadMode";
import { CameraContent } from "@/components/ocr/input/CameraMode";
import type { InputModeRef, InputMode } from "@/types/ocr";

const INPUT_MODES: Array<{ key: InputMode; label: string; icon: React.ReactNode }> = [
	{ key: "draw", label: "Draw", icon: <PenLine suppressHydrationWarning className="w-4 h-4" /> },
	{ key: "upload", label: "Upload", icon: <FileImage suppressHydrationWarning className="w-4 h-4" /> },
	{ key: "camera", label: "Camera", icon: <Camera suppressHydrationWarning className="w-4 h-4" /> },
];

const MODE_HELPERS: Record<InputMode, string> = {
	draw: "Draw a single Odia character.",
	upload: "Upload a single Odia character.",
	camera: "Point the camera at a single Odia character.",
};

export function OcrWorkspace() {
	const [activeMode, setActiveMode] = useState<InputMode>("draw");
	const [activePage, setActivePage] = useState<0 | 1>(0);
	const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
	const [inputError, setInputError] = useState<string | null>(null);
	const [predictionError, setPredictionError] = useState<string | null>(null);
	const [isPredicting, setIsPredicting] = useState(false);
	const [helperVisible, setHelperVisible] = useState(true);
	const [canPredict, setCanPredict] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const [autoLoading, setAutoLoading] = useState(false);
	const [autoResult, setAutoResult] = useState<PredictionResponse | null>(null);
	const hasAutoResultRef = useRef(false);
	const autoFetchAbortRef = useRef<AbortController | null>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	const menuRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const inputModeRef = useRef<InputModeRef>(null);
	const inputSectionRef = useRef<HTMLDivElement | null>(null);
	const resultSectionRef = useRef<HTMLDivElement | null>(null);
	const hasResults = Boolean(prediction || predictionError || isPredicting);
	const previousHasResultsRef = useRef(false);
	const pagerRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		setPrediction(null);
		setInputError(null);
		setPredictionError(null);
		setCanPredict(false);
		setAutoLoading(false);
		setAutoResult(null);
		hasAutoResultRef.current = false;
		autoFetchAbortRef.current?.abort();
		autoFetchAbortRef.current = null;
	}, [activeMode]);

	useEffect(() => {
		setHelperVisible(false);
		const id = window.setTimeout(() => setHelperVisible(true), 60);
		return () => window.clearTimeout(id);
	}, [activeMode]);

	useEffect(() => {
		previousHasResultsRef.current = hasResults;
	}, [hasResults]);

	useEffect(() => {
		const isMobile = window.matchMedia("(max-width: 1023px)").matches;

		if (!isMobile) {
			return;
		}

		window.requestAnimationFrame(() => {
			inputSectionRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "start",
			});
			setActivePage(0);
		});
	}, [activeMode]);

	useEffect(() => {
		const pager = pagerRef.current;
		if (!pager) {
			return;
		}

		const onScroll = () => {
			if (window.matchMedia("(min-width: 1024px)").matches) {
				return;
			}

			const nextPage = pager.scrollLeft > pager.clientWidth / 2 ? 1 : 0;
			setActivePage((current) => (current === nextPage ? current : nextPage));
		};

		pager.addEventListener("scroll", onScroll, { passive: true });
		return () => pager.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (activePage === 0) {
			hasAutoResultRef.current = false;
		}
	}, [activePage]);

	const scrollToPage = (pageIndex: 0 | 1) => {
		const pager = pagerRef.current;
		if (!pager) {
			return;
		}

		pager.scrollTo({
			left: pageIndex === 0 ? 0 : pager.clientWidth,
			behavior: "smooth",
		});
		setActivePage(pageIndex);
	};

	const handleStrokeEnd = useCallback(async () => {
		if (isPredicting) return;

		autoFetchAbortRef.current?.abort();
		const controller = new AbortController();
		autoFetchAbortRef.current = controller;

		setAutoLoading(true);

		try {
			const blob = await inputModeRef.current?.predict();
			if (!blob || controller.signal.aborted) return;

			const result = await predictOdiaCharacter(blob);
			if (!controller.signal.aborted) {
				setAutoResult(result);
				hasAutoResultRef.current = true;
			}
		} catch {
			if (!controller.signal.aborted) {
				setAutoResult(null);
				hasAutoResultRef.current = false;
			}
		} finally {
			if (!controller.signal.aborted) {
				setAutoLoading(false);
			}
		}
	}, [isPredicting]);

	const handleClear = () => {
		autoFetchAbortRef.current?.abort();
		autoFetchAbortRef.current = null;
		setAutoLoading(false);
		setAutoResult(null);
		hasAutoResultRef.current = false;

		inputModeRef.current?.clear();
		setPrediction(null);
		setInputError(null);
		setPredictionError(null);
		setHelperVisible(true);
	};

	const handlePredict = async () => {
		const isMobile = window.matchMedia("(max-width: 1023px)").matches;

		if (isMobile && hasAutoResultRef.current) {
			hasAutoResultRef.current = false;
			setAutoResult(null);
			setPrediction(autoResult);
			setPredictionError(null);
			window.requestAnimationFrame(() => {
				resultSectionRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "start",
				});
			});
			return;
		}

		autoFetchAbortRef.current?.abort();
		autoFetchAbortRef.current = null;
		setAutoLoading(false);

		setIsPredicting(true);
		setHelperVisible(false);
		setInputError(null);
		setPredictionError(null);

		try {
			const file = await inputModeRef.current?.predict();

			if (!file) {
				setInputError("Choose, capture, or draw a handwritten character first.");
				setIsPredicting(false);
				return;
			}

			const result = await predictOdiaCharacter(file);
			setPrediction(result);

			if (isMobile) {
				window.requestAnimationFrame(() => {
					resultSectionRef.current?.scrollIntoView({
						behavior: "smooth",
						block: "nearest",
						inline: "start",
					});
				});
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : "Prediction failed.";
			setPredictionError(message);

			if (isMobile) {
				window.requestAnimationFrame(() => {
					resultSectionRef.current?.scrollIntoView({
						behavior: "smooth",
						block: "nearest",
						inline: "start",
					});
				});
			}
		} finally {
			setIsPredicting(false);
			setHelperVisible(true);
		}
	};

	const displayPrediction = prediction ?? autoResult;
	const displayLoading = isPredicting || autoLoading;
	const displayError = isPredicting ? predictionError : (prediction ? predictionError : null);

	return (
		<main className="relative mx-auto flex h-[calc(100dvh-4.5rem)] max-w-375 flex-col gap-3 box-border overflow-hidden px-3 pb-8 pt-8 sm:px-4 lg:gap-4 lg:px-8 lg:py-6 lg:p-8 lg:justify-center">
			{/* Desktop Mode Switcher */}
			<div className="hidden lg:flex w-full justify-center shrink-0 mb-2">
				<div className="inline-flex rounded-full bg-white/5 p-1 border border-white/5 shadow-inner">
					{INPUT_MODES.map((mode) => (
						<button
							key={mode.key}
							type="button"
							onClick={() => setActiveMode(mode.key)}
							className={`relative flex items-center gap-2 rounded-full px-6 py-2 text-sm font-bold transition-colors duration-200 ${activeMode === mode.key ? "text-white" : "text-slate-400 hover:text-slate-200"
							}`}
						>
							{activeMode === mode.key && (
								<motion.div
									layoutId="desktop-mode-bg"
									className="absolute inset-0 rounded-full bg-verdigris-800 shadow-sm ring-1 ring-white/10"
									transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
								/>
							)}
							<span className="relative z-10 flex items-center gap-2">
								{mode.icon}
								{mode.label}
							</span>
						</button>
					))}
				</div>
			</div>

			<section ref={pagerRef} className="flex h-full min-h-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-none lg:grid lg:h-auto lg:w-full lg:max-w-5xl lg:mx-auto lg:grid-cols-2 lg:gap-8 lg:overflow-visible lg:items-stretch">
				<div
					ref={inputSectionRef}
					className="lg:panel relative flex h-full min-h-0 w-full shrink-0 snap-start flex-col rounded-xl p-3 sm:p-4 lg:h-auto lg:min-h-0 lg:w-auto lg:shrink lg:p-6"
				>
					<div className="mt-0 flex min-h-0 flex-1 flex-col items-center justify-center">
						<InputWorkspace
							helperText={MODE_HELPERS[activeMode]}
							helperVisible={helperVisible}
							error={inputError}
							onClear={handleClear}
							onPredict={handlePredict}
							isPredicting={isPredicting}
							canPredict={mounted && canPredict}
						>
							{activeMode === "draw" && (
								<DrawContent
									ref={inputModeRef}
									onReadyChange={setCanPredict}
									disabled={isPredicting}
									onStrokeEnd={handleStrokeEnd}
								/>
							)}
							{activeMode === "upload" && (
								<UploadContent
									ref={inputModeRef}
									onReadyChange={setCanPredict}
									disabled={isPredicting}
									onError={setInputError}
								/>
							)}
							{activeMode === "camera" && (
								<CameraContent
									ref={inputModeRef}
									onReadyChange={setCanPredict}
									disabled={isPredicting}
									onError={setInputError}
								/>
							)}
						</InputWorkspace>
					</div>
				</div>

				<div
					ref={resultSectionRef}
					className="lg:panel relative flex h-full min-h-0 w-full shrink-0 snap-start flex-col rounded-xl p-3 sm:p-4 lg:h-auto lg:min-h-0 lg:w-auto lg:shrink lg:p-6"
				>
					<div className="mt-0 flex min-h-0 h-full w-full flex-col justify-center">
					    <PredictionCard prediction={displayPrediction} loading={displayLoading} error={displayError} />
					</div>
				</div>
			</section>

			<div className="flex items-center justify-center lg:hidden mt-0 mb-1">
				<div className="inline-flex rounded-full bg-white/5 p-1 border border-white/5 shadow-inner">
					<button
						type="button"
						aria-label="Show input section"
						onClick={() => scrollToPage(0)}
						className={`relative rounded-full px-5 py-1.5 text-xs font-bold transition-colors duration-200 ${activePage === 0 ? "text-white" : "text-slate-400 hover:text-slate-200"
						}`}
					>
						{activePage === 0 && (
							<motion.div
								layoutId="active-pill-bg"
								className="absolute inset-0 rounded-full bg-verdigris-800 shadow-sm ring-1 ring-white/10"
								transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
							/>
						)}
						<span className="relative z-10">Input</span>
					</button>
					<button
						type="button"
						aria-label="Show results section"
						onClick={() => scrollToPage(1)}
						className={`relative rounded-full px-5 py-1.5 text-xs font-bold transition-colors duration-200 ${activePage === 1 ? "text-white" : "text-slate-400 hover:text-slate-200"
						}`}
					>
						{activePage === 1 && (
							<motion.div
								layoutId="active-pill-bg"
								className="absolute inset-0 rounded-full bg-verdigris-800 shadow-sm ring-1 ring-white/10"
								transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
							/>
						)}
						<span className="relative z-10">Results</span>
					</button>
				</div>
			</div>

			{/* Bottom Right Floating Menu */}
			<div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:hidden z-60 flex flex-col items-end" ref={menuRef}>
				{isMenuOpen && (
					<div className="mb-2 w-40 overflow-hidden rounded-2xl border border-white/10 bg-verdigris-950/90 p-1 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
						{INPUT_MODES.map((mode) => (
							<button
								key={mode.key}
								type="button"
								onClick={() => {
									setActiveMode(mode.key);
									setIsMenuOpen(false);
								}}
								className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${activeMode === mode.key ? "bg-verdigris-800 text-white" : "text-slate-300 hover:bg-verdigris-900/50 hover:text-white"
								}`}
							>
								{mode.icon}
								<span>{mode.label}</span>
							</button>
						))}
					</div>
				)}
				<button
					type="button"
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					aria-label="Input Options"
					className="flex items-center justify-center p-2 text-slate-400 transition-colors hover:text-white"
				>
					<MoreVertical className="h-5 w-5 sm:h-6 sm:w-6" />
				</button>
			</div>
		</main>
	);
}
