"use client";

import { useRef, useState } from "react";

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
    <div className="flex h-full min-h-0 flex-col gap-2 px-2 py-2 sm:px-3">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleChange} />

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          className={`flex aspect-square h-[clamp(300px,32vw,344px)] w-[clamp(300px,32vw,344px)] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border bg-white/90 transition dark:bg-black/20 ${isDragActive
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
      </div>

      {helperText ? (
        <div className={`mt-2 w-full max-w-[336px] transition-opacity duration-200 ${helperVisible ? "opacity-100" : "opacity-0"} mx-auto text-center`}>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{helperText}</p>
        </div>
      ) : null}

      <div className="flex w-full max-w-[336px] items-center gap-3 mt-4">
        <button type="button" className="secondary-button flex-1 px-3 py-2 text-sm" onClick={() => { onClear(); }}>
          Clear
        </button>
        <button type="button" className="primary-button flex-1 px-4 py-2 text-sm" onClick={() => onPredict()} disabled={!previewUrl || disabled}>
          Predict
        </button>
      </div>

      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}
