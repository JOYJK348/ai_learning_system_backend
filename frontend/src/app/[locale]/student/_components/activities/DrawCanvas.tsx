'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type Props = {
  config: { prompt?: string; color?: string };
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
};

export default function DrawCanvas({ config, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [done, setDone] = useState(false);
  const [dimensions, setDimensions] = useState({ w: 500, h: 300 });
  const startTime = useRef(Date.now());
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const prompt = (config.prompt as string) || 'Draw something!';
  const drawColor = (config.color as string) || '#4ECDC4';

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setDimensions({ w, h: Math.round(w * 0.6) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;
  }, [dimensions]);

  const getCanvasPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const startDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (done) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    lastPoint.current = pos;
  }, [done, getCanvasPos]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || done) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPoint.current = pos;
    if (!hasDrawn) setHasDrawn(true);
  }, [isDrawing, done, getCanvasPos, drawColor, hasDrawn]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPoint.current = null;
  }, []);

  const handleFinish = () => {
    if (done) return;
    setDone(true);
    onComplete({
      score: hasDrawn ? 100 : 50,
      max_score: 100,
      completion_data: { submitted: hasDrawn },
      time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000),
    });
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    setDone(false);
    setIsDrawing(false);
    startTime.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 px-3 sm:px-6 pt-4 sm:pt-8 pb-3 sm:pb-6">
      <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-lg text-center">{prompt}</h3>
      <div ref={containerRef}
        className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden touch-none border border-white/30 shadow-inner"
        style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair w-full h-full"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
        {!hasDrawn && !done && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ minHeight: dimensions.h }}>
            <p className="text-white/40 font-bold text-base sm:text-lg">Draw here!</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 sm:gap-3">
        {!done ? (
          <button onClick={handleFinish}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white font-black rounded-full shadow-lg transition-all text-sm sm:text-base">
            Done Drawing! ✅
          </button>
        ) : (
          <button onClick={handleReset}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-full shadow-lg transition-all text-sm sm:text-base">
            Draw Again 🔄
          </button>
        )}
      </div>
      <p className="text-[9px] sm:text-xs font-bold text-white/50 text-center">
        {!done ? 'Use your finger to draw! Any scribble counts! 🎨' : '✨ Great drawing!'}
      </p>
    </div>
  );
}
