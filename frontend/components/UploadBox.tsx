"use client";

import { useRef, useState } from "react";

interface UploadBoxProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export function UploadBox({ onFileSelected, disabled = false }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Choose a PNG or JPEG image.");
      event.target.value = "";
      return;
    }

    setError(null);
    onFileSelected(file);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-dashed border-slate-900/15 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Upload image</p>
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Select a handwritten Odia character image in PNG, JPG, or JPEG format.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="primary-button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Choose file
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-400">No preprocessing happens in the browser.</p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={handleChange}
          />

          {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
