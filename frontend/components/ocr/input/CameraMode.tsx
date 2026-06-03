"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import type { InputModeRef } from "@/types/ocr";

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
		const capturedFileRef = useRef<File | null>(null);

		const startCamera = async () => {
			let isMounted = true;
			if (!navigator.mediaDevices?.getUserMedia) {
				const err = "Camera access is not available in this browser.";
				setCameraError(err);
				return () => {
					isMounted = false;
				};
			}

			const constraints: MediaStreamConstraints = {
				video: {
					facingMode: { ideal: "environment" },
				},
				audio: false,
			};

			try {
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				if (!isMounted) {
					stopStream(stream);
					return () => {};
				}

				streamRef.current = stream;
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
				setCameraError(null);
				onReadyChange(true);
			} catch {
				try {
					const fallbackStream = await navigator.mediaDevices.getUserMedia({
						video: true,
						audio: false,
					});
					if (!isMounted) {
						stopStream(fallbackStream);
						return () => {};
					}

					streamRef.current = fallbackStream;
					if (videoRef.current) {
						videoRef.current.srcObject = fallbackStream;
					}
					setCameraError(null);
					onReadyChange(true);
				} catch {
					if (isMounted) {
						const err =
							"We couldn't access your camera. Please allow camera permissions in your browser settings and try again.";
						setCameraError(err);
					}
				}
			}

			return () => {
				isMounted = false;
				stopStream(streamRef.current);
				streamRef.current = null;
			};
		};

		let cleanupFn: (() => void) | undefined;

		useEffect(() => {
			startCamera().then((fn) => {
				cleanupFn = fn;
			});
			return () => {
				if (cleanupFn) cleanupFn();
			};
		}, []);

		useEffect(() => {
			return () => {
				if (capturedFrameUrl) {
					URL.revokeObjectURL(capturedFrameUrl);
				}
			};
		}, [capturedFrameUrl]);

		const captureFrame = async (): Promise<File | null> => {
			if (capturedFileRef.current) {
				return capturedFileRef.current;
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

			context.drawImage(video, 0, 0, canvas.width, canvas.height);

			const blob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob((value) => resolve(value), "image/png");
			});

			if (!blob) {
				onError("Could not convert the captured image.");
				return null;
			}

			const file = new File([blob], "lipi-camera.png", { type: "image/png" });
			const nextUrl = URL.createObjectURL(blob);

			setCapturedFrameUrl(nextUrl);
			capturedFileRef.current = file;

			stopStream(streamRef.current);
			streamRef.current = null;

			return file;
		};

		useImperativeHandle(ref, () => ({
			clear: () => {
				if (capturedFrameUrl) URL.revokeObjectURL(capturedFrameUrl);
				setCapturedFrameUrl(null);
				capturedFileRef.current = null;
				onReadyChange(false);
				startCamera().then((fn) => {
					cleanupFn = fn;
				});
			},
			predict: async () => {
				return await captureFrame();
			},
		}));

		if (cameraError) {
			return (
				<div className="flex h-full w-full items-center justify-center p-6 text-center">
					<div className="max-w-sm">
						<p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">Camera Access Required</p>
						<p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
							{cameraError}
						</p>
					</div>
				</div>
			);
		}

		return (
			<div className="flex h-full w-full items-center justify-center overflow-hidden">
				{capturedFrameUrl ? (
					<img
						src={capturedFrameUrl}
						alt="Captured frame"
						className="h-full w-full object-contain p-3"
					/>
				) : (
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="h-full w-full object-contain p-3"
					/>
				)}
			</div>
		);
	}
);
