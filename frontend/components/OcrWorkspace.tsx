"use client";

import { useEffect, useState } from "react";

import { CameraCapture } from "@/components/CameraCapture";
import { DrawCanvas } from "@/components/DrawCanvas";
import { PredictionCard } from "@/components/PredictionCard";
import { UploadBox } from "@/components/UploadBox";
import { predictOdiaCharacter } from "@/lib/api";
import type { PredictionResponse } from "@/lib/types";

type InputMode = "draw" | "upload" | "camera";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg"]);

const INPUT_MODES: Array<{ key: InputMode; label: string }> = [
	{ key: "draw", label: "Draw" },
	{ key: "upload", label: "Upload" },
	{ key: "camera", label: "Camera" },
];

const MODE_HELPERS: Record<InputMode, string> = {
	draw: "Draw a single Odia character.",
	upload: "Upload a single Odia character.",
	camera: "Point the camera at a single Odia character.",
};

export function OcrWorkspace() {
	const [activeMode, setActiveMode] = useState<InputMode>("draw");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
	const [inputError, setInputError] = useState<string | null>(null);
	const [predictionError, setPredictionError] = useState<string | null>(null);
	const [isPredicting, setIsPredicting] = useState(false);
	const [helperVisible, setHelperVisible] = useState(true);

	useEffect(() => {
		if (!selectedFile) {
			setPreviewUrl(null);
			return;
		}

		const url = URL.createObjectURL(selectedFile);
		setPreviewUrl(url);

		return () => URL.revokeObjectURL(url);
	}, [selectedFile]);

	useEffect(() => {
		setSelectedFile(null);
		setPrediction(null);
		setInputError(null);
		setPredictionError(null);
	}, [activeMode]);

	useEffect(() => {
		setHelperVisible(false);
		const id = window.setTimeout(() => setHelperVisible(true), 60);
		return () => window.clearTimeout(id);
	}, [activeMode]);

	const handleFileSelected = (file: File) => {
		if (!ACCEPTED_TYPES.has(file.type)) {
			setInputError("Choose a PNG or JPEG image before predicting.");
			return;
		}

		setInputError(null);
		setPredictionError(null);
		setPrediction(null);
		setSelectedFile(file);
	};

	const runPrediction = async (overrideFile?: File) => {
		const targetFile = overrideFile ?? selectedFile;

		if (!targetFile) {
			setInputError("Choose, capture, or draw a handwritten character first.");
			return;
		}

		if (!ACCEPTED_TYPES.has(targetFile.type)) {
			setInputError("Choose a PNG or JPEG image before predicting.");
			return;
		}

		setIsPredicting(true);
		setHelperVisible(false);
		setInputError(null);
		setPredictionError(null);

		if (overrideFile) {
			setSelectedFile(overrideFile);
		}

		try {
			const result = await predictOdiaCharacter(targetFile);
			setPrediction(result);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Prediction failed.";
			setPredictionError(message);
		} finally {
			setIsPredicting(false);
		}
	};

	const resetInput = () => {
		setSelectedFile(null);
		setPrediction(null);
		setHelperVisible(true);
		setInputError(null);
		setPredictionError(null);
	};

	return (
		<main className="relative mx-auto flex h-[calc(100vh-4.25rem)] max-w-[1500px] flex-col gap-3 px-3 pb-3 pt-3 sm:px-4 lg:overflow-hidden lg:px-5 lg:pb-4">
			<section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(330px,0.92fr)]">
				<div className="panel flex min-h-0 flex-col rounded-xl p-3 sm:p-4">
					<div className="border-b border-slate-900/8 pb-3 dark:border-white/10">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Character Input</p>
					</div>

					<div className="mt-3 flex items-center justify-center gap-1.5">
						{INPUT_MODES.map((mode) => {
							const isActive = activeMode === mode.key;

							return (
								<button
									key={mode.key}
									type="button"
									className={`tab-button ${isActive ? "tab-button-active" : "tab-button-inactive"}`}
									onClick={() => setActiveMode(mode.key)}
									aria-pressed={isActive}
								>
									{mode.label}
								</button>
							);
						})}
					</div>

					<div className="mt-3 flex min-h-0 flex-1 items-center justify-center">
						{activeMode === "draw" ? (
							<DrawCanvas
								onPredict={(file) => runPrediction(file)}
								disabled={isPredicting}
								onClear={resetInput}
								helperText={MODE_HELPERS.draw}
								helperVisible={helperVisible}
							/>
						) : null}
						{activeMode === "upload" ? (
							<UploadBox
								onFileSelected={handleFileSelected}
								onClear={resetInput}
								onPredict={(file) => runPrediction(file)}
								disabled={isPredicting}
								previewUrl={previewUrl}
								helperText={MODE_HELPERS.upload}
								helperVisible={helperVisible}
							/>
						) : null}
						{activeMode === "camera" ? (
							<CameraCapture
								onFileSelected={handleFileSelected}
								onClear={resetInput}
								onPredict={(file) => runPrediction(file)}
								disabled={isPredicting}
								helperText={MODE_HELPERS.camera}
								helperVisible={helperVisible}
							/>
						) : null}
					</div>

					{inputError ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{inputError}</p> : null}
				</div>

				<div className="panel flex min-h-0 flex-col rounded-xl p-3 sm:p-4">
					<div className="border-b border-slate-900/8 pb-3 dark:border-white/10">
						<p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Recognition Results</p>
					</div>
					<PredictionCard prediction={prediction} loading={isPredicting} error={predictionError} />
				</div>
			</section>
		</main>
	);
}