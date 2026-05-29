"use client";

import { useEffect, useMemo, useState } from "react";

import { CameraCapture } from "@/components/CameraCapture";
import { DrawCanvas } from "@/components/DrawCanvas";
import { Header } from "@/components/Header";
import { PredictionCard } from "@/components/PredictionCard";
import { TopPredictions } from "@/components/TopPredictions";
import { UploadBox } from "@/components/UploadBox";
import { predictOdiaCharacter } from "@/lib/api";
import type { PredictionResponse } from "@/lib/types";

type InputMode = "upload" | "camera" | "draw";

const ACCEPTED_TYPES = new Set(["image/png", "image/jpeg"]);

const INPUT_MODES: Array<{ key: InputMode; label: string; description: string }> = [
  {
    key: "upload",
    label: "Upload Image",
    description: "Select a PNG or JPEG handwritten character.",
  },
  {
    key: "camera",
    label: "Live Camera",
    description: "Capture a frame directly from your webcam.",
  },
  {
    key: "draw",
    label: "Draw Character",
    description: "Use the built-in canvas and export a PNG.",
  },
];

export default function Page() {
  const [activeMode, setActiveMode] = useState<InputMode>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

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

  const previewCopy = useMemo(() => {
    if (activeMode === "draw") {
      return "The canvas itself is the input. Click Predict drawing when you are ready.";
    }

    if (activeMode === "camera") {
      return "Capture a frame and it will appear here before prediction.";
    }

    return "Upload an image, review it here, then send it to the backend.";
  }, [activeMode]);

  return (
    <main className="relative mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40 dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]" />

      <div className="relative space-y-6">
        <Header />

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="panel rounded-[2rem] p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                {INPUT_MODES.map((mode) => {
                  const isActive = activeMode === mode.key;
                  return (
                    <button
                      key={mode.key}
                      type="button"
                      className={`tab-button ${isActive ? "tab-button-active" : "tab-button-inactive"}`}
                      onClick={() => setActiveMode(mode.key)}
                    >
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {INPUT_MODES.find((mode) => mode.key === activeMode)?.description}
              </p>
            </div>

            <div className="panel rounded-[2rem] p-5 sm:p-6">
              {activeMode === "upload" ? <UploadBox onFileSelected={handleFileSelected} disabled={isPredicting} /> : null}
              {activeMode === "camera" ? <CameraCapture onFileSelected={handleFileSelected} disabled={isPredicting} /> : null}
              {activeMode === "draw" ? <DrawCanvas onPredict={runPrediction} disabled={isPredicting} /> : null}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="panel rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Preview</p>
                  <h2 className="mt-2 font-display text-xl font-semibold text-slate-950 dark:text-white">Input image</h2>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => runPrediction()}
                  disabled={!selectedFile || isPredicting}
                >
                  {isPredicting ? "Predicting..." : "Predict"}
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-slate-900/10 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                {previewUrl ? (
                  <img src={previewUrl} alt="Selected handwritten character preview" className="h-72 w-full object-contain p-4 sm:h-80" />
                ) : (
                  <div className="flex h-72 flex-col items-center justify-center px-6 text-center sm:h-80">
                    <p className="font-mono text-sm uppercase tracking-[0.3em] text-slate-400">No preview yet</p>
                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">{previewCopy}</p>
                  </div>
                )}
              </div>

              {selectedFile ? (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-900/10 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <span className="truncate font-mono">{selectedFile.name}</span>
                  <span>{Math.round(selectedFile.size / 1024)} KB</span>
                </div>
              ) : null}

              {inputError ? <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{inputError}</p> : null}
              {predictionError ? <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{predictionError}</p> : null}
            </section>

            <PredictionCard prediction={prediction} loading={isPredicting} error={predictionError} />
            <TopPredictions items={prediction?.top_predictions ?? []} />
          </aside>
        </section>
      </div>
    </main>
  );
}
