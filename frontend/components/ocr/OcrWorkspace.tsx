"use client";

import { useEffect, useRef, useState } from "react";

import { PenLine, FileImage, Camera } from "lucide-react";

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
	}, [activeMode]);

	useEffect(() => {
		setHelperVisible(false);
		const id = window.setTimeout(() => setHelperVisible(true), 60);
		return () => window.clearTimeout(id);
	}, [activeMode]);

	useEffect(() => {
		const isMobile = window.matchMedia("(max-width: 1023px)").matches;
		const becameVisible = hasResults && !previousHasResultsRef.current;

		if (isMobile && becameVisible) {
			window.requestAnimationFrame(() => {
				resultSectionRef.current?.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "start",
				});
			});
		}

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

	const handleClear = () => {
		inputModeRef.current?.clear();
		setPrediction(null);
		setInputError(null);
		setPredictionError(null);
		setHelperVisible(true);
	};

	const handlePredict = async () => {
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
		} catch (error) {
			const message = error instanceof Error ? error.message : "Prediction failed.";
			setPredictionError(message);
		} finally {
			setIsPredicting(false);
		}
	};

	return (
		<main className="relative mx-auto flex h-[calc(100svh-4.5rem)] max-w-[1500px] flex-col gap-3 box-border overflow-hidden px-3 pb-3 pt-3 sm:px-4 lg:gap-6 lg:px-8 lg:py-8 lg:p-8">
			<div className="flex items-center justify-center lg:hidden mt-1 mb-2">
				<div className="inline-flex rounded-full bg-slate-900/5 p-1 dark:bg-white/5 border border-slate-900/5 dark:border-white/5 shadow-inner">
					<button
						type="button"
						aria-label="Show input section"
						onClick={() => scrollToPage(0)}
						className={`rounded-full px-5 py-1.5 text-xs font-bold transition-all ${
							activePage === 0 
								? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white ring-1 ring-slate-900/5 dark:ring-white/10" 
								: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
						}`}
					>
						Input
					</button>
					<button
						type="button"
						aria-label="Show results section"
						onClick={() => scrollToPage(1)}
						className={`rounded-full px-5 py-1.5 text-xs font-bold transition-all ${
							activePage === 1 
								? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white ring-1 ring-slate-900/5 dark:ring-white/10" 
								: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
						}`}
					>
						Results
					</button>
				</div>
			</div>

			<section ref={pagerRef} className="flex h-full min-h-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-smooth scrollbar-none lg:grid lg:h-full lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)] lg:gap-8 lg:overflow-visible">
				<div
					ref={inputSectionRef}
					className="panel relative flex h-full min-h-0 w-full shrink-0 snap-start flex-col rounded-xl p-3 pt-14 sm:p-4 sm:pt-16 lg:h-full lg:min-h-0 lg:w-auto lg:shrink lg:p-6 lg:pt-20"
				>
					<div className="absolute top-0 left-0 right-0 flex h-11 sm:h-12 border-slate-900/10 dark:border-white/10 lg:h-14">
						<div className={`flex-1 flex items-center px-4 sm:px-5 transition-colors border-slate-900/10 dark:border-white/10 rounded-tl-xl bg-slate-900/[0.04] dark:bg-white/[0.04] border-b ${activeMode === 'draw' ? 'border-r-transparent rounded-br-lg' : 'border-r'}`}>
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 leading-none">Character Input</p>
						</div>

						<div className="flex">
							{INPUT_MODES.map((mode, idx) => {
								const isActive = activeMode === mode.key;
								
								let cornerClasses = "";
								if (activeMode === "draw") {
									if (idx === 1) cornerClasses = "rounded-bl-lg ";
								} else if (activeMode === "upload") {
									if (idx === 0) cornerClasses = "rounded-br-lg ";
									if (idx === 2) cornerClasses = "rounded-bl-lg ";
								} else if (activeMode === "camera") {
									if (idx === 1) cornerClasses = "rounded-br-lg ";
								}

								if (idx === 2) {
									cornerClasses += "rounded-tr-xl ";
								}

								const nextMode = INPUT_MODES[idx + 1]?.key;
								const hideRightBorder = activeMode === nextMode || idx === 2;

								return (
									<button
										key={mode.key}
										type="button"
										onClick={() => setActiveMode(mode.key)}
										className={`relative flex items-center justify-center w-11 sm:w-12 transition-colors border-slate-900/10 dark:border-white/10 ${cornerClasses} ${
											isActive
												? "bg-transparent text-slate-950 dark:text-white z-10 border-transparent"
												: `bg-slate-900/[0.04] dark:bg-white/[0.04] text-slate-500 hover:bg-slate-900/[0.06] hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 z-0 border-b ${hideRightBorder ? 'border-r-transparent' : 'border-r'}`
										}`}
										aria-pressed={isActive}
										title={mode.label}
									>
										{mode.icon}
									</button>
								);
							})}
						</div>
					</div>

					<div className="mt-0 flex min-h-0 flex-1 items-center justify-center">
						<InputWorkspace
							helperText={MODE_HELPERS[activeMode]}
							helperVisible={helperVisible}
							error={inputError}
							onClear={handleClear}
							onPredict={handlePredict}
							isPredicting={isPredicting}
							canPredict={canPredict}
						>
							{activeMode === "draw" && (
								<DrawContent
									ref={inputModeRef}
									onReadyChange={setCanPredict}
									disabled={isPredicting}
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
					className="panel relative flex h-full min-h-0 w-full shrink-0 snap-start flex-col rounded-xl p-3 pt-14 sm:p-4 sm:pt-16 lg:h-full lg:min-h-0 lg:w-auto lg:shrink lg:p-6 lg:pt-20"
				>
					<div className="absolute top-0 left-0 right-0 flex h-11 sm:h-12 border-slate-900/10 dark:border-white/10 lg:h-14">
						<div className="flex-1 flex items-center px-4 sm:px-5 transition-colors border-slate-900/10 dark:border-white/10 rounded-t-xl bg-slate-900/[0.04] dark:bg-white/[0.04] border-b">
							<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 leading-none">Recognition Results</p>
						</div>
					</div>
					<div className="mt-0 flex min-h-0 h-full w-full">
					    <PredictionCard prediction={prediction} loading={isPredicting} error={predictionError} />
					</div>
				</div>
			</section>
		</main>
	);
}
