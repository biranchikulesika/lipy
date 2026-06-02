"use client";

import { useEffect, useRef, useState } from "react";

import { InputModeShell } from "@/components/InputModeShell";

interface DrawCanvasProps {
	onPredict: (file?: File) => void;
	disabled?: boolean;
	onClear?: () => void;
	helperText?: string | null;
	helperVisible?: boolean;
}

type Point = {
	x: number;
	y: number;
};

const CANVAS_SIZE = 336;
const STROKE_WIDTH = 18;

export function DrawCanvas({
	onPredict,
	disabled = false,
	onClear,
	helperText = null,
	helperVisible = true,
}: DrawCanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const isDrawingRef = useRef(false);
	const previousPointRef = useRef<Point | null>(null);

	const [hasDrawing, setHasDrawing] = useState(false);

	const paintCanvasBackground = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const context = canvas.getContext("2d");
		if (!context) return;

		context.fillStyle = "#ffffff";
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

		setHasDrawing(true);

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

		setHasDrawing(false);

		onClear?.();
	};

	const exportDrawing = async () => {
		const canvas = canvasRef.current;
		if (!canvas) return null;

		return await new Promise<File | null>((resolve) => {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						resolve(null);
						return;
					}

					resolve(
						new File([blob], "lipi-drawing.png", {
							type: "image/png",
						})
					);
				},
				"image/png"
			);
		});
	};

	const handlePredict = async () => {
		if (disabled || !hasDrawing) {
			return;
		}

		const file = await exportDrawing();

		if (!file) {
			return;
		}

		onPredict(file);
	};

	return (
		<InputModeShell
			helperText={helperText}
			helperVisible={helperVisible}
			actionRow={
				<div className="mt-2 flex w-full max-w-[320px] items-center gap-2 sm:max-w-[336px]">
					<button
						type="button"
						className="secondary-button flex-1 px-3 py-2 text-xs sm:text-sm"
						onClick={clearCanvas}
					>
						Clear
					</button>

					<button
						type="button"
						className="primary-button flex-1 px-3 py-2 text-xs sm:px-4 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50"
						onClick={handlePredict}
						disabled={disabled || !hasDrawing}
					>
						Predict
					</button>
				</div>
			}
		>
			<div className="flex aspect-square w-full max-w-[344px] items-center justify-center overflow-hidden rounded-xl border border-slate-900/15 bg-white/90 transition dark:border-white/15 dark:bg-black/20">
				<canvas
					ref={canvasRef}
					className="h-full w-full touch-none p-3"
					onPointerDown={beginStroke}
					onPointerMove={continueStroke}
					onPointerUp={endStroke}
					onPointerLeave={endStroke}
					aria-label="Drawing canvas"
				/>
			</div>
		</InputModeShell>
	);
}