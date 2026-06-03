"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle } from "lucide-react";
import type { PredictionResponse } from "@/types/ocr";
import { getOdiaCharacter, ODIA_CHARACTER_BY_LABEL } from "@/lib/odiaCharacters";

function RandomSubtleCharacter() {
  const characters = Object.values(ODIA_CHARACTER_BY_LABEL);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * characters.length));

  useEffect(() => {
    // We already have a fast initial value, now set the interval
    const interval = setInterval(() => {
      setIndex(Math.floor(Math.random() * characters.length));
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [characters.length]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="absolute flex items-center justify-center text-4xl font-medium text-slate-500 dark:text-slate-400 sm:text-5xl"
        >
          {characters[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface PredictionCardProps {
  prediction: PredictionResponse | null;
  loading?: boolean;
  error?: string | null;
}

function formatConfidence(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function getConfidenceColors(confidence: number | undefined | null) {
  if (confidence == null) return { bar: "bg-slate-900 dark:bg-slate-200", text: "text-slate-950 dark:text-white" };
  if (confidence >= 0.85) return { bar: "bg-emerald-500 dark:bg-emerald-400", text: "text-emerald-600 dark:text-emerald-400" };
  if (confidence >= 0.50) return { bar: "bg-amber-500 dark:bg-amber-400", text: "text-amber-600 dark:text-amber-400" };
  return { bar: "bg-rose-500 dark:bg-rose-400", text: "text-rose-600 dark:text-rose-400" };
}

export function PredictionCard({
  prediction,
  loading = false,
  error = null,
}: PredictionCardProps) {
  const hasPrediction = Boolean(prediction);
  const topPredictions = prediction?.top_predictions.slice(0, 3) ?? [];

  const [displayError, setDisplayError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setDisplayError(error);
      const timer = setTimeout(() => {
        setDisplayError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <section className="relative flex min-h-0 flex-1 flex-col gap-3">
      {/* Combined Mobile View */}
      <div className="block sm:hidden rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Detected Character</p>
          {loading ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Running</p> : null}
        </div>

        {displayError ? (
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-amber-500/10 bg-amber-500/5 p-3 dark:border-amber-400/20 dark:bg-amber-400/5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-100/50 dark:bg-amber-400/10 text-amber-600 overflow-hidden">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="flex-1 text-xs text-amber-700 dark:text-amber-300 line-clamp-2">
              <span className="font-semibold block mb-0.5">Unable to Predict</span>
              {displayError}
            </div>
          </div>
        ) : hasPrediction ? (
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-slate-900/8 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-3xl font-semibold text-white dark:bg-slate-200 dark:text-slate-950">
              {getOdiaCharacter(prediction!.prediction)}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confidence</p>
              <div className="mt-0.5 flex items-end gap-2">
                <p className={`font-mono text-2xl font-semibold leading-none ${getConfidenceColors(prediction?.confidence).text}`}>
                  {formatConfidence(prediction!.confidence)}
                </p>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                <div
                  className={`h-full rounded-full ${getConfidenceColors(prediction?.confidence).bar}`}
                  style={{ width: `${Math.max(3, prediction!.confidence * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-dashed border-slate-900/8 bg-slate-50/70 p-3 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
             <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-slate-500 overflow-hidden">
               <RandomSubtleCharacter />
             </div>
             <div className="flex-1 text-xs">
               Draw, upload, or capture.
             </div>
          </div>
        )}
      </div>

      {/* Desktop View: Separate Blocks */}
      <div className="hidden sm:block rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Detected Character</p>
          {loading ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Running</p> : null}
        </div>

        {displayError ? (
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-amber-500/10 bg-amber-500/5 p-4 dark:border-amber-400/20 dark:bg-amber-400/5">
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-100/50 dark:bg-amber-400/10 text-amber-600 overflow-hidden sm:h-20 sm:w-20">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 text-sm text-amber-700 dark:text-amber-300 line-clamp-2">
              <span className="font-semibold block mb-1">Unable to Predict</span>
              {displayError}
            </div>
          </div>
        ) : hasPrediction ? (
          <div className="mt-3 flex items-start gap-3 rounded-lg border border-slate-900/8 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-3xl font-semibold text-white dark:bg-slate-200 dark:text-slate-950 sm:h-20 sm:w-20 sm:text-4xl">
              {getOdiaCharacter(prediction!.prediction)}
            </div>
            <div className="min-w-0">
              <p className="lg:truncate font-mono text-sm font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">{prediction!.prediction}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">This is the most likely character based on your input.</p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-start gap-4 rounded-lg border border-dashed border-slate-900/8 bg-slate-50/70 p-4 text-sm leading-6 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:items-center">
             <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-slate-500 overflow-hidden sm:h-20 sm:w-20">
               <RandomSubtleCharacter />
             </div>
             <div className="flex-1">
               No prediction yet. Draw, upload, or capture a character to see the detected result.
             </div>
          </div>
        )}
      </div>

      <div className="hidden sm:block rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Confidence</p>
          {loading ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Running</p> : null}
        </div>

        <div className="mt-3 flex items-end gap-3">
          <p className={`font-mono text-3xl font-semibold leading-none ${hasPrediction ? getConfidenceColors(prediction!.confidence).text : "text-slate-950 dark:text-white"}`}>
            {hasPrediction ? formatConfidence(prediction!.confidence) : "0.0%"}
          </p>
          <p className="pb-1 text-sm text-slate-600 dark:text-slate-300">
            {hasPrediction ? "How sure the model is" : "Awaiting your input"}
          </p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${hasPrediction ? getConfidenceColors(prediction!.confidence).bar : "bg-slate-900 dark:bg-slate-200"}`}
            style={{ width: hasPrediction ? `${Math.max(3, prediction!.confidence * 100)}%` : "12%" }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-900/8 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Top Predictions</p>
          {loading ? <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Running</p> : null}
        </div>

        <div className="mt-3 space-y-2">
          {(hasPrediction ? topPredictions : [
            { label: "Most likely character", confidence: 0 },
            { label: "Alternative character", confidence: 0 },
            { label: "Another alternative", confidence: 0 },
          ]).map((item, index) => {
            const confidence = Math.round(item.confidence * 1000) / 10;
            
            return (
            <div key={item.label + "-" + index} className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-slate-900/8 bg-slate-50/80 px-3 py-2.5 dark:border-white/10 dark:bg-white/5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white dark:bg-slate-200 dark:text-slate-950">{index + 1}</span>
                {hasPrediction ? (
                  <span className="flex w-6 justify-center font-display text-2xl leading-none text-slate-950 dark:text-white">
                    {getOdiaCharacter(item.label)}
                  </span>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-dashed border-slate-300 bg-slate-100/50 dark:border-white/10 dark:bg-white/5">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">?</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="lg:truncate font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-300">
                    {item.label}
                  </p>
                </div>
                <p className={`font-mono text-sm font-semibold ${hasPrediction ? getConfidenceColors(item.confidence).text : "text-slate-700 dark:text-slate-200"}`}>
                  {hasPrediction ? `${confidence.toFixed(1)}%` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
