import { useEffect, useRef } from 'react';

export default function useCanvasDrawing(canvasRef: React.RefObject<HTMLCanvasElement | null>, strokeWidth = 4) {
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 512;
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctxRef.current = canvas.getContext('2d');
    const ctx = ctxRef.current;
    if (!ctx) return;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(1, strokeWidth) * dpr;

    const getPos = (ev: any) => {
      const rect = canvas.getBoundingClientRect();
      if (ev.touches && ev.touches[0]) {
        return { x: (ev.touches[0].clientX - rect.left) * (canvas.width / rect.width), y: (ev.touches[0].clientY - rect.top) * (canvas.height / rect.height) };
      }
      return { x: (ev.clientX - rect.left) * (canvas.width / rect.width), y: (ev.clientY - rect.top) * (canvas.height / rect.height) };
    };

    let last: any = null;

    const onDown = (e: any) => {
      e.preventDefault();
      drawingRef.current = true;
      last = getPos(e);
    };
    const onMove = (e: any) => {
      if (!drawingRef.current) return;
      e.preventDefault();
      const p = getPos(e);
      ctx.strokeStyle = 'black';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    };
    const onUp = () => {
      drawingRef.current = false;
      last = null;
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    canvas.style.touchAction = 'none';

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [canvasRef]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.lineWidth = Math.max(1, strokeWidth) * dpr;
  }, [strokeWidth, canvasRef]);

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2 = canvas.getContext('2d');
    if (!ctx2) return;
    ctx2.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.fillStyle = 'white';
    ctx2.fillRect(0, 0, canvas.width, canvas.height);
  }

  function getImageBlob(): Promise<Blob> {
    const canvas = canvasRef.current;
    return new Promise((resolve, reject) => {
      if (!canvas) {
        reject(new Error("Canvas not available"));
        return;
      }
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to create blob"));
      }, 'image/png');
    });
  }

  return { clearCanvas, getImageBlob };
}
