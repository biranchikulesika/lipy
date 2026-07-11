"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import type { InputModeRef } from "@/types/ocr";

interface DrawContentProps {
	onReadyChange: (isReady: boolean) => void;
	disabled?: boolean;
	onStrokeEnd?: () => void;
}

type Point = { x: number; y: number };

const CANVAS_SIZE = 336;
const STROKE_WIDTH = 18;
const STROKE_DEBOUNCE_MS = 400;

export const DrawContent = forwardRef<InputModeRef, DrawContentProps>(
	({ onReadyChange, disabled = false, onStrokeEnd }, ref) => {
		const canvasRef = useRef<HTMLCanvasElement | null>(null);
		const isDrawingRef = useRef(false);
		const previousPointRef = useRef<Point | null>(null);
		const hasDrawingRef = useRef(false);

		const onStrokeEndRef = useRef(onStrokeEnd);
		onStrokeEndRef.current = onStrokeEnd;

		const strokeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const drawingVersionRef = useRef(0);

		const clearStrokeTimer = useCallback(() => {
			if (strokeTimerRef.current !== null) {
				clearTimeout(strokeTimerRef.current);
				strokeTimerRef.current = null;
			}
		}, []);

		const paintCanvasBackground = () => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			const context = canvas.getContext("2d");
			if (!context) return;

			context.fillStyle = "#f8fafc";
			context.fillRect(0, 0, canvas.width, canvas.height);
		};

		useEffect(() => {
			const canvas = canvasRef.current;
			if (!canvas) return;

			canvas.width = CANVAS_SIZE;
			canvas.height = CANVAS_SIZE;

			const context = canvas.getContext("2d");
			if (!context) return;

			context.lineCap = "round";
			context.lineJoin = "round";
			context.lineWidth = STROKE_WIDTH;

			paintCanvasBackground();
		}, []);

		useEffect(() => {
			return () => clearStrokeTimer();
		}, [clearStrokeTimer]);

		useImperativeHandle(ref, () => ({
			clear: () => {
				clearStrokeTimer();
				paintCanvasBackground();
				hasDrawingRef.current = false;
				onReadyChange(false);
			},
			predict: async () => {
				if (!hasDrawingRef.current) return null;
				const canvas = canvasRef.current;
				if (!canvas) return null;

				return await new Promise<Blob | null>((resolve) => {
					canvas.toBlob(
						(blob) => {
							resolve(blob);
						},
						"image/png"
					);
				});
			},
		}));

		const getPoint = (
			event: React.PointerEvent<HTMLCanvasElement>
		): Point | null => {
			const canvas = canvasRef.current;
			if (!canvas) return null;

			const rect = canvas.getBoundingClientRect();

			return {
				x: ((event.clientX - rect.left) / rect.width) * canvas.width,
				y: ((event.clientY - rect.top) / rect.height) * canvas.height,
			};
		};

		const beginStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
			if (disabled) return;

			const canvas = canvasRef.current;
			const context = canvas?.getContext("2d");
			const point = getPoint(event);

			if (!canvas || !context || !point) return;

			canvas.setPointerCapture(event.pointerId);

			isDrawingRef.current = true;
			previousPointRef.current = point;

			context.beginPath();
			context.moveTo(point.x, point.y);
		};

		const continueStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
			if (!isDrawingRef.current || disabled) return;

			const canvas = canvasRef.current;
			const context = canvas?.getContext("2d");
			const point = getPoint(event);
			const previousPoint = previousPointRef.current;

			if (!canvas || !context || !point || !previousPoint) return;

			context.strokeStyle = "#111111";
			context.lineWidth = STROKE_WIDTH;

			context.beginPath();
			context.moveTo(previousPoint.x, previousPoint.y);
			context.lineTo(point.x, point.y);
			context.stroke();

			if (!hasDrawingRef.current) {
				hasDrawingRef.current = true;
				onReadyChange(true);
			}

			previousPointRef.current = point;
		};

		const endStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
			const canvas = canvasRef.current;

			if (canvas?.hasPointerCapture(event.pointerId)) {
				canvas.releasePointerCapture(event.pointerId);
			}

			isDrawingRef.current = false;
			previousPointRef.current = null;

			if (hasDrawingRef.current && onStrokeEndRef.current) {
				drawingVersionRef.current += 1;
				const thisVersion = drawingVersionRef.current;

				clearStrokeTimer();
				strokeTimerRef.current = setTimeout(() => {
					strokeTimerRef.current = null;
					if (drawingVersionRef.current === thisVersion) {
						onStrokeEndRef.current?.();
					}
				}, STROKE_DEBOUNCE_MS);
			}
		};

		return (
			<canvas
				ref={canvasRef}
				className="h-full w-full touch-none p-3 rounded-2xl"
				onPointerDown={beginStroke}
				onPointerMove={continueStroke}
				onPointerUp={endStroke}
				aria-label="Drawing canvas"
			/>
		);
	}
);
