"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle } from "lucide-react";
import type { PredictionResponse } from "@/types/ocr";
import { getOdiaCharacter, ODIA_CHARACTER_BY_LABEL } from "@/lib/odiaCharacters";

function RandomSubtleCharacter() {
  const characters = Object.values(ODIA_CHARACTER_BY_LABEL);
  const [index, setIndex] = useState(0); // Stable initial state for SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIndex(Math.floor(Math.random() * characters.length));
    
    const interval = setInterval(() => {
      setIndex(Math.floor(Math.random() * characters.length));
    }, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [characters.length]);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={mounted ? index : "ssr"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="absolute flex items-center justify-center text-4xl font-medium text-slate-500 dark:text-slate-400 sm:text-5xl"
        >
          {mounted ? characters[index] : characters[0]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PredictionSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-5 w-full animate-pulse">
      <div className="h-28 w-28 shrink-0 rounded-3xl bg-verdigris-100 dark:bg-verdigris-900/30 sm:h-32 sm:w-32" />
      <div className="flex w-full flex-col items-center gap-2">
        <div className="h-3 w-24 rounded-full bg-verdigris-100 dark:bg-verdigris-900/30" />
      </div>
    </div>
  );
}

interface PredictionCardProps {
  prediction: PredictionResponse | null;
  loading?: boolean;
  error?: string | null;
}

function getConfidenceColors(confidence: number | undefined | null) {
  if (confidence == null) return { bar: "bg-verdigris-900 dark:bg-verdigris-200", text: "text-slate-950 dark:text-white" };
  // Aligned with API thresholds: LOW_CONFIDENCE_THRESHOLD = 0.60, AMBIGUOUS_MARGIN = 0.10
  if (confidence >= 0.85) return { bar: "bg-verdigris-500 dark:bg-verdigris-400", text: "text-emerald-600 dark:text-emerald-400" };
  if (confidence >= 0.60) return { bar: "bg-verdigris-500 dark:bg-verdigris-400", text: "text-amber-600 dark:text-amber-400" };
  return { bar: "bg-verdigris-500 dark:bg-verdigris-400", text: "text-rose-600 dark:text-rose-400" };
}

function getStatusDisplay(prediction: PredictionResponse) {
  const { status } = prediction;

  if (status === "low_confidence") {
    return {
      icon: <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12" />,
      title: "Unable to Recognize",
      message: "The model could not confidently recognize this character. Try drawing it more clearly or in a different style.",
      color: "text-amber-600 dark:text-amber-300",
      iconBg: "bg-amber-100/50 dark:bg-amber-400/10",
    };
  }

  if (status === "ambiguous") {
    return {
      icon: (
        <svg className="h-10 w-10 sm:h-12 sm:w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      ),
      title: "Prediction is Ambiguous",
      message: "The model is uncertain between multiple characters. Review the top matches below.",
      color: "text-amber-600 dark:text-amber-300",
      iconBg: "bg-amber-100/50 dark:bg-amber-400/10",
    };
  }

  // success
  return null;
}

export function PredictionCard({
  prediction,
  loading = false,
  error = null,
}: PredictionCardProps) {
  const hasResponse = Boolean(prediction);
  const status = prediction?.status;
  const isSuccess = status === "success";
  const isLowConfidence = status === "low_confidence";
  const isAmbiguous = status === "ambiguous";
  const topPredictions = prediction?.top_predictions.slice(0, 3) ?? [];

  const statusDisplay = prediction ? getStatusDisplay(prediction) : null;
  const predictedLabel = prediction?.prediction;
  const predictedCharacter = prediction?.character || (predictedLabel ? getOdiaCharacter(predictedLabel) : null);

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
    <section className="relative flex min-h-0 flex-1 flex-col justify-start gap-3 pt-2 sm:pt-4 pb-2">
      {/* Unified Primary Prediction Card */}
      <div className="relative flex flex-col justify-center min-h-[220px] sm:min-h-[260px] rounded-xl border border-verdigris-900/8 bg-white/70 p-4 sm:p-5 dark:border-white/10 dark:bg-white/5">
        {loading ? (
          <PredictionSkeleton />
        ) : displayError ? (
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 w-full">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-verdigris-100/50 dark:bg-verdigris-400/10 text-amber-600 sm:h-28 sm:w-28">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <div className="flex-1 text-sm text-amber-700 dark:text-amber-300 line-clamp-3 text-center max-w-[260px]">
              <span className="font-bold block mb-1 text-base">Unable to Predict</span>
              {displayError}
            </div>
          </div>
        ) : isLowConfidence || isAmbiguous ? (
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 w-full">
            <div className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl ${statusDisplay?.iconBg} ${statusDisplay?.color} sm:h-28 sm:w-28`}>
              {statusDisplay?.icon}
            </div>
            <div className="flex-1 text-sm text-center max-w-[260px]">
              <span className={`font-bold block mb-1 text-base ${statusDisplay?.color}`}>{statusDisplay?.title}</span>
              <span className="text-slate-600 dark:text-slate-400">{statusDisplay?.message}</span>
            </div>
          </div>
        ) : isSuccess && predictedCharacter ? (
          <div className="flex flex-col items-center justify-center gap-4 sm:gap-5 w-full">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-verdigris-800 to-verdigris-900 text-6xl font-semibold text-white shadow-inner dark:from-verdigris-200 dark:to-verdigris-300 dark:text-slate-950 sm:h-32 sm:w-32 sm:text-7xl">
              {predictedCharacter}
            </div>
            <div className="flex w-full flex-col items-center justify-center text-center">
              {predictedLabel && (
                <span className="mt-1 text-[10px] font-mono font-medium tracking-wider text-slate-400 dark:text-slate-500">
                  {predictedLabel}
                </span>
              )}
              <p className="mt-1 text-[10px] text-slate-400/80 dark:text-slate-500 max-w-[220px]">
                Our ML is trained on small dataset. It can make mistakes.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 text-sm leading-6 text-slate-600 dark:text-slate-300 w-full">
             <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl border border-dashed border-verdigris-900/10 dark:border-white/10 bg-verdigris-50/50 dark:bg-white/5 overflow-hidden sm:h-32 sm:w-32">
               <RandomSubtleCharacter />
             </div>
             <div className="flex-1 text-xs sm:text-sm text-center max-w-[240px]">
               Draw, upload, or capture a character to see the detected result.
             </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-verdigris-900/8 bg-white/70 p-4 sm:p-5 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Top Predictions</p>
          {isLowConfidence && (
            <span className="text-[10px] font-medium text-rose-500 dark:text-rose-400">low confidence</span>
          )}
          {isAmbiguous && (
            <span className="text-[10px] font-medium text-amber-500 dark:text-amber-400">uncertain</span>
          )}
        </div>

        <div className="flex flex-col">
          {(hasResponse ? topPredictions : [
            { label: "Most likely character", confidence: 0, character: "" },
            { label: "Close matching", confidence: 0, character: "" },
            { label: "Another close matching", confidence: 0, character: "" },
          ]).map((item, index) => {
            const displayConfidence = Math.round(item.confidence * 1000) / 10;
            
            return (
              <div key={item.label + "-" + index} className="flex items-center justify-between gap-3 px-1 py-3 border-b border-verdigris-900/5 dark:border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-verdigris-900/10 text-[11px] font-bold text-verdigris-900 dark:bg-verdigris-200/10 dark:text-verdigris-200">{index + 1}</span>
                  {hasResponse ? (
                    <div className="flex items-center gap-2">
                      <span className="flex w-6 justify-center font-display text-2xl leading-none text-slate-950 dark:text-white">
                        {item.character || getOdiaCharacter(item.label)}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">({item.label})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-dashed border-verdigris-300 bg-verdigris-100/50 dark:border-white/10 dark:bg-white/5">
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">?</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{item.label}</span>
                    </div>
                  )}
                </div>
                <p className={`font-mono text-sm font-bold ${hasResponse ? getConfidenceColors(item.confidence).text : "text-slate-400 dark:text-slate-500"}`}>
                  {hasResponse ? `${displayConfidence.toFixed(1)}%` : "—"}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
