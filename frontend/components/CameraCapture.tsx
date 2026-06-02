"use client";

import { useEffect, useRef, useState } from "react";

import { InputModeShell } from "@/components/InputModeShell";

interface CameraCaptureProps {
  onFileSelected: (file: File) => void;
  onClear: () => void;
  onPredict: (file?: File) => void;
  disabled?: boolean;
  helperText?: string | null;
  helperVisible?: boolean;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function CameraCapture({ onFileSelected, onClear, onPredict, disabled = false, helperText = null, helperVisible = true }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  useEffect(() => {
    return () => {
      if (capturedFrameUrl) {
        URL.revokeObjectURL(capturedFrameUrl);
      }
    };
  }, [capturedFrameUrl]);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not available in this browser.");
        setIsStarting(false);
        return;
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
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          if (!isMounted) {
            stopStream(fallbackStream);
            return;
          }

          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
          setCameraError(null);
        } catch {
          if (isMounted) {
            setCameraError("Unable to access the camera. Allow permissions and try again.");
          }
        }
      } finally {
        if (isMounted) {
          setIsStarting(false);
        }
      }
    };

    void startCamera();

    return () => {
      isMounted = false;
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is not ready yet.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Could not capture the camera frame.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/png");
    });

    if (!blob) {
      setCameraError("Could not convert the captured image.");
      return;
    }

    const file = new File([blob], "lipi-camera.png", { type: "image/png" });
    const nextUrl = URL.createObjectURL(blob);
    if (capturedFrameUrl) {
      URL.revokeObjectURL(capturedFrameUrl);
    }
    setCapturedFrameUrl(nextUrl);
    setCapturedFile(file);
    stopStream(streamRef.current);
    streamRef.current = null;
    setCameraError(null);
    onFileSelected(file);
    return file;
  };

  const retakeCapture = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available in this browser.");
      return;
    }

    setCapturedFrameUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });
    setIsStarting(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Unable to access the camera. Allow permissions and try again.");
    } finally {
      setIsStarting(false);
    }
  };

  const captureAndMaybePredict = async (autoPredict = false) => {
    const file = await captureFrame();
    if (!file) return;
    if (autoPredict) {
      onPredict?.(file);
    }
  };

  return (
    <InputModeShell
      helperText={helperText}
      helperVisible={helperVisible}
      errorSlot={
        <div className="relative w-full max-w-[344px] mx-auto">
          {cameraError ? (
            <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-[-0.25rem] z-10 -translate-y-full max-h-14 overflow-hidden rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm leading-6 text-rose-700 shadow-sm dark:text-rose-200" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>
              {cameraError}
            </div>
          ) : null}
        </div>
      }
      actionRow={
        <div className="mt-2 flex w-full max-w-[320px] items-center gap-2 sm:max-w-[336px]">
          {capturedFrameUrl ? (
            <>
              <button type="button" className="secondary-button flex-1 px-3 py-2 text-xs sm:text-sm" onClick={() => { retakeCapture(); onClear(); setCapturedFile(null); }} disabled={disabled}>
                Clear
              </button>
              <button type="button" className="primary-button flex-1 px-3 py-2 text-xs sm:px-4 sm:text-sm" onClick={() => onPredict(capturedFile ?? undefined)} disabled={!capturedFrameUrl || disabled}>
                Predict
              </button>
            </>
          ) : (
            <>
              <button type="button" className="secondary-button flex-1 px-3 py-2 text-xs sm:text-sm" onClick={() => { onClear(); retakeCapture(); setCapturedFile(null); }} disabled={disabled || isStarting}>
                Clear
              </button>
              <button type="button" className="primary-button flex-1 px-3 py-2 text-xs sm:px-4 sm:text-sm" onClick={() => void captureAndMaybePredict(true)} disabled={disabled || isStarting}>
                Predict
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="flex aspect-square w-full max-w-[344px] items-center justify-center overflow-hidden rounded-xl border border-slate-900/15 bg-white/90 transition dark:border-white/15 dark:bg-black/20">
        {cameraError ? (
          <div className="p-4 text-center text-sm text-rose-600 dark:text-rose-400">{cameraError}</div>
        ) : capturedFrameUrl ? (
          <img src={capturedFrameUrl} alt="Captured camera frame" className="h-full w-full object-contain p-3" />
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain p-3" />
        )}
      </div>
    </InputModeShell>
  );
}
