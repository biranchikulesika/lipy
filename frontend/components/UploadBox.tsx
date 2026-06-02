"use client";

import { useRef, useState } from "react";

import { InputModeShell } from "@/components/InputModeShell";

interface UploadBoxProps {
  onFileSelected: (file: File) => void;
  onClear: () => void;
  onPredict: (file?: File) => void;
  disabled?: boolean;
  previewUrl: string | null;
  helperText?: string | null;
  helperVisible?: boolean;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export function UploadBox({ onFileSelected, onClear, onPredict, disabled = false, previewUrl, helperText = null, helperVisible = true }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const processFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Choose a PNG or JPEG image.");
      return;
    }

    setError(null);
    onFileSelected(file);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    processFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    if (disabled) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    processFile(file);
  };

  return (
    <InputModeShell
      helperText={helperText}
      helperVisible={helperVisible}
      errorSlot={
        <div className="relative w-full max-w-[344px] mx-auto">
          {error ? (
            <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-[-0.25rem] z-10 -translate-y-full max-h-14 overflow-hidden rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm leading-6 text-rose-700 shadow-sm dark:text-rose-200" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>
              {error}
            </div>
          ) : null}
        </div>
      }
      actionRow={
        <div className="mt-2 flex w-full max-w-[320px] items-center gap-2 sm:max-w-[336px]">
          <button type="button" className="secondary-button flex-1 px-3 py-2 text-xs sm:text-sm" onClick={() => { onClear(); }}>
            Clear
          </button>
          <button type="button" className="primary-button flex-1 px-3 py-2 text-xs sm:px-4 sm:text-sm" onClick={() => onPredict()} disabled={!previewUrl || disabled}>
            Predict
          </button>
        </div>
      }
    >
      <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleChange} />

      <div
        className={`flex aspect-square w-full max-w-[344px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-white/90 transition dark:bg-black/20 ${isDragActive
          ? "border-slate-900/40 dark:border-white/50"
          : "border-slate-900/15 hover:border-slate-900/30 dark:border-white/15 dark:hover:border-white/35"
          }`}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragActive(true);
          }
        }}
        onDragLeave={() => setIsDragActive(false)}
        aria-label="Upload workspace"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Uploaded handwritten character preview" className="h-full w-full object-contain p-3" />
        ) : (
          <div className="px-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Upload mode</p>
            <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">Click to upload or drag an image</p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">PNG JPG JPEG</p>
          </div>
        )}
      </div>
    </InputModeShell>
  );
}
