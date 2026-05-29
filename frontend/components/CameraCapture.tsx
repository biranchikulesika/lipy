"use client";

import { useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function CameraCapture({ onFileSelected, disabled = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

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
    setCameraError(null);
    onFileSelected(file);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-slate-900/10 bg-slate-950/5 dark:border-white/10 dark:bg-white/5">
        <div className="border-b border-slate-900/10 px-4 py-3 dark:border-white/10">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Live camera</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Capture a handwritten character from your webcam.</p>
        </div>

        <div className="p-4">
          <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-black dark:border-white/10">
            <video ref={videoRef} autoPlay playsInline muted className="h-72 w-full object-cover sm:h-80" />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="primary-button" onClick={captureFrame} disabled={disabled || isStarting}>
              Capture frame
            </button>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isStarting ? "Starting camera..." : "Use a clean, well-lit character image."}
            </p>
          </div>

          {cameraError ? <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{cameraError}</p> : null}
        </div>
      </div>
    </div>
  );
}
