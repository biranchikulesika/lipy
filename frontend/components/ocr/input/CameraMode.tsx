"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import type { InputModeRef } from "@/types/ocr";
import { RefreshCw, Camera } from "lucide-react";

interface CameraContentProps {
	onReadyChange: (isReady: boolean) => void;
	disabled?: boolean;
	onError: (error: string | null) => void;
}

function stopStream(stream: MediaStream | null) {
	stream?.getTracks().forEach((track) => track.stop());
}

export const CameraContent = forwardRef<InputModeRef, CameraContentProps>(
	({ onReadyChange, disabled = false, onError }, ref) => {
		const videoRef = useRef<HTMLVideoElement | null>(null);
		const streamRef = useRef<MediaStream | null>(null);
		const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);
		const [cameraError, setCameraError] = useState<string | null>(null);
		const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
		const [isSwitching, setIsSwitching] = useState(false);
		const [retryCount, setRetryCount] = useState(0);
		const capturedBlobRef = useRef<Blob | File | null>(null);
		const mountedRef = useRef(true);

		useEffect(() => {
			mountedRef.current = true;
			return () => {
				mountedRef.current = false;
			};
		}, []);

		const startCamera = useCallback(async (facing: "environment" | "user") => {
			if (!navigator.mediaDevices?.getUserMedia) {
				const err = "Camera access is not available in this browser.";
				setCameraError(err);
				onReadyChange(false);
				return;
			}

			const constraints: MediaStreamConstraints = {
				video: {
					facingMode: { ideal: facing },
				},
				audio: false,
			};

			try {
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				if (!mountedRef.current) {
					stopStream(stream);
					return;
				}

				// Stop any previous stream before setting the new one
				stopStream(streamRef.current);
				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
				setCameraError(null);
				onReadyChange(true);
			} catch (err) {
				// Fallback: try any camera
				try {
					const fallbackStream = await navigator.mediaDevices.getUserMedia({
						video: true,
						audio: false,
					});
					if (!mountedRef.current) {
						stopStream(fallbackStream);
						return;
					}
					stopStream(streamRef.current);
					streamRef.current = fallbackStream;
					if (videoRef.current) {
						videoRef.current.srcObject = fallbackStream;
					}
					setCameraError(null);
					onReadyChange(true);
				} catch {
					if (mountedRef.current) {
						// Determine if the error is a permanent denial vs a transient issue
						const isPermissionDenied =
							err instanceof DOMException &&
							(err.name === "NotAllowedError" || err.name === "PermissionDeniedError");

						if (isPermissionDenied && retryCount > 0) {
							// Browser has permanently denied access — no prompt will show again
							setCameraError(
								`Camera access is blocked in your browser settings. ` +
								`To allow it, go to your browser's site settings` +
								`find the camera permission, and set it to Allow. ` +
								`Then refresh this page.`
							);
						} else if (isPermissionDenied) {
							setCameraError(
								`Permission was denied.`
							);
						} else {
							// Hardware or other error
							setCameraError(
								`Please allow camera permissions in your browser settings and try again.`
							);
						}
						onReadyChange(false);
					}
				}
			}
		}, [onReadyChange, retryCount]);

		// Initial camera start
		useEffect(() => {
			startCamera(facingMode);
			return () => {
				stopStream(streamRef.current);
				streamRef.current = null;
			};
		}, []); // only on mount

		useEffect(() => {
			if (capturedFrameUrl) {
				return () => {
					URL.revokeObjectURL(capturedFrameUrl);
				};
			}
		}, [capturedFrameUrl]);

		const handleSwitchCamera = async () => {
			if (isSwitching) return;
			setIsSwitching(true);

			const nextFacing = facingMode === "environment" ? "user" : "environment";
			setFacingMode(nextFacing);

			stopStream(streamRef.current);
			streamRef.current = null;
			setCameraError(null);
			onReadyChange(false);

			await startCamera(nextFacing);
			setIsSwitching(false);
		};

		const captureFrame = async (): Promise<Blob | File | null> => {
			if (capturedBlobRef.current) {
				return capturedBlobRef.current;
			}

			const video = videoRef.current;
			if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
				onError("Camera is not ready yet.");
				return null;
			}

			const canvas = document.createElement("canvas");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;

			const context = canvas.getContext("2d");
			if (!context) {
				onError("Could not capture the camera frame.");
				return null;
			}

			// Mirror the image if using front camera so it matches the preview
			if (facingMode === "user") {
				context.translate(canvas.width, 0);
				context.scale(-1, 1);
			}
			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			const blob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob((value) => resolve(value), "image/png");
			});

			if (!blob) {
				onError("Could not convert the captured image.");
				return null;
			}

			const nextUrl = URL.createObjectURL(blob);

			setCapturedFrameUrl(nextUrl);
			capturedBlobRef.current = blob;

			stopStream(streamRef.current);
			streamRef.current = null;

			return blob;
		};

		useImperativeHandle(ref, () => ({
			clear: () => {
				if (capturedFrameUrl) URL.revokeObjectURL(capturedFrameUrl);
				setCapturedFrameUrl(null);
				capturedBlobRef.current = null;
				onReadyChange(false);
				startCamera(facingMode);
			},
			predict: async () => {
				return await captureFrame();
			},
		}));

		const handleRetryCamera = async () => {
			if (isSwitching) return;
			setIsSwitching(true);
			setCameraError(null);
			setRetryCount((c) => c + 1);
			await startCamera(facingMode);
			setIsSwitching(false);
		};

		if (cameraError) {
			return (
				<button
					type="button"
					onClick={handleRetryCamera}
					disabled={isSwitching}
					className="flex h-full w-full cursor-pointer items-center justify-center p-6 text-center transition-all duration-200 hover:bg-white/2 active:bg-white/4 disabled:opacity-60"
					aria-label="Tap to request camera access again"
					title="Tap to try again"
				>
					<div className="max-w-sm space-y-2">
						<div className="flex items-center justify-center">
							<Camera className={`h-8 w-8 text-amber-400/60 ${isSwitching ? "animate-pulse" : ""}`} />
						</div>
						<p className="text-sm font-medium text-amber-300">
							{isSwitching ? "Requesting camera..." : "Camera Access Required"}
						</p>
						<p className="text-xs text-amber-400/80 leading-relaxed">
							{cameraError}
						</p>
						<p className="text-[10px] text-amber-500/60 font-semibold uppercase tracking-wider mt-1 animate-pulse">
							Tap to retry
						</p>
					</div>
				</button>
			);
		}

		return (
			<div className="relative flex h-full w-full items-center justify-center overflow-hidden group">
				{capturedFrameUrl ? (
					<img
						src={capturedFrameUrl}
						alt="Captured frame"
						className="h-full w-full object-contain p-3 rounded-2xl"
					/>
				) : (
					<>
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className={`h-full w-full object-contain p-3 rounded-2xl ${facingMode === "user" ? "scale-x-[-1]" : ""
							}`}
						/>
						{/* Camera switch button — positioned inside the camera box */}
						<button
							type="button"
							onClick={handleSwitchCamera}
							disabled={isSwitching}
							className="absolute bottom-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-white/10"
							aria-label="Switch camera"
							title={facingMode === "environment" ? "Switch to front camera" : "Switch to back camera"}
						>
							<RefreshCw className={`h-5 w-5 transition-transform duration-300 ${isSwitching ? "animate-spin" : ""}`} />
						</button>
					</>
				)}
			</div>
		);
	}
);
