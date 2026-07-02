"use client";

import { useRef, useState, useImperativeHandle, forwardRef } from "react";
import type { InputModeRef } from "@/types/ocr";

interface UploadContentProps {
	onReadyChange: (isReady: boolean) => void;
	disabled?: boolean;
	onError: (error: string | null) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export const UploadContent = forwardRef<InputModeRef, UploadContentProps>(
	({ onReadyChange, disabled = false, onError }, ref) => {
		const inputRef = useRef<HTMLInputElement | null>(null);
		const [isDragActive, setIsDragActive] = useState(false);
		const [previewUrl, setPreviewUrl] = useState<string | null>(null);
		const fileRef = useRef<File | null>(null);

		useImperativeHandle(ref, () => ({
			clear: () => {
				if (previewUrl) URL.revokeObjectURL(previewUrl);
				setPreviewUrl(null);
				fileRef.current = null;
				if (inputRef.current) inputRef.current.value = "";
				onReadyChange(false);
				onError(null);
			},
			predict: async () => {
				return fileRef.current;
			},
		}));

		const processFile = (file: File) => {
			if (!ACCEPTED_TYPES.includes(file.type)) {
				onError("Choose a PNG or JPEG image.");
				return;
			}

			onError(null);
			fileRef.current = file;
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);
			onReadyChange(true);
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
			<>
				<input
					ref={inputRef}
					type="file"
					accept="image/png,image/jpeg"
					className="hidden"
					onChange={handleChange}
				/>

				<div
					className={`flex h-full w-full cursor-pointer items-center justify-center overflow-hidden transition ${
						isDragActive
							? "bg-verdigris-900/10 dark:bg-white/10"
							: ""
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
						<img
							src={previewUrl}
							alt="Uploaded handwritten character preview"
							className="h-full w-full object-contain p-3 rounded-2xl"
						/>
					) : (
						<div className="px-6 text-center">
							<p className="font-mono text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
								Upload mode
							</p>
							<p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
								Click to upload or drag an image
							</p>
							<p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
								PNG JPG JPEG
							</p>
						</div>
					)}
				</div>
			</>
		);
	}
);
