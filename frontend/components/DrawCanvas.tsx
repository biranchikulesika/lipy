"use client";

import { useEffect, useRef, useState } from "react";

interface DrawCanvasProps {
  onPredict: (file: File) => void;
  disabled?: boolean;
}

type Point = {
  x: number;
  y: number;
};

const CANVAS_SIZE = 512;
const STROKE_WIDTH = 24;

export function DrawCanvas({ onPredict, disabled = false }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const previousPointRef = useRef<Point | null>(null);
  const [eraseMode, setEraseMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Draw a single Odia character on the white canvas.");

  const paintCanvasBackground = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = STROKE_WIDTH;
    paintCanvasBackground();
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const beginStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);
    if (!canvas || !context || !point) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    isDrawingRef.current = true;
    previousPointRef.current = point;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const continueStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);
    const previousPoint = previousPointRef.current;

    if (!canvas || !context || !point || !previousPoint) {
      return;
    }

    context.strokeStyle = eraseMode ? "#ffffff" : "#111111";
    context.lineWidth = eraseMode ? STROKE_WIDTH * 1.8 : STROKE_WIDTH;
    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    previousPointRef.current = point;
  };

  const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }

    isDrawingRef.current = false;
    previousPointRef.current = null;
  };

  const clearCanvas = () => {
    paintCanvasBackground();
    setStatusMessage("Canvas cleared.");
  };

  const exportDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    return await new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }

        resolve(new File([blob], "lipi-drawing.png", { type: "image/png" }));
      }, "image/png");
    });
  };

  const handlePredict = async () => {
    if (disabled) {
      return;
    }

    const file = await exportDrawing();
    if (!file) {
      setStatusMessage("Could not export the canvas.");
      return;
    }

    setStatusMessage("Canvas exported and sent for prediction.");
    onPredict(file);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-900/10 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Draw character</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Use bold black strokes on the white canvas. The backend receives the exported PNG.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="secondary-button" onClick={() => setEraseMode((value) => !value)}>
              {eraseMode ? "Pen mode" : "Erase mode"}
            </button>
            <button type="button" className="secondary-button" onClick={clearCanvas}>
              Clear canvas
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-inner dark:border-white/10">
          <canvas
            ref={canvasRef}
            className="h-[360px] w-full touch-none bg-white sm:h-[420px]"
            onPointerDown={beginStroke}
            onPointerMove={continueStroke}
            onPointerUp={endStroke}
            onPointerLeave={endStroke}
            aria-label="Drawing canvas"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="primary-button" onClick={handlePredict} disabled={disabled}>
            Predict drawing
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">{statusMessage}</p>
        </div>
      </div>
    </div>
  );
}
