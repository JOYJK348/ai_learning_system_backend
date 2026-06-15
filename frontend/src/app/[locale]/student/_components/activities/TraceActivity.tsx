'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type Props = {
  config: { path?: string; color?: string; thickness?: number; tolerance?: number; mode?: string };
  hasAttempt?: boolean;
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
};

const PASS_THRESHOLD = 70;

const GUIDE_EMOJIS: Record<string, string> = {
  standing: '🐛', sleeping: '🚗', slanting: '🛷', curved: '🦋', zigzag: '🐇',
  's-curve': '🐍', circle: '⭕',
  'left-slanting': '🛷', 'right-slanting': '🛷',
  'left-curve': '🌀', 'right-curve': '🌀', 'up-curve': '🌈', 'down-curve': '🌈',
  'letter-a': '🍎', 'letter-b': '🏀', 'letter-c': '🐱', 'letter-d': '🐕',
  'letter-e': '🐘', 'letter-f': '🐟', 'letter-g': '🍇', 'letter-h': '🎩',
  'letter-i': '🍦', 'letter-j': '🏺', 'letter-k': '🪁', 'letter-l': '🦁',
  'letter-m': '🥭',
};
const GUIDE_HEADINGS: Record<string, string> = {
  standing: '🐛 Trace the Standing Line!',
  sleeping: '🚗 Trace the Sleeping Line!',
  slanting: '🛷 Trace the Slanting Line!',
  curved: '🦋 Trace the Curved Line!',
  zigzag: '🐇 Trace the Zig Zag!',
  's-curve': '🐍 Trace the Wavy Path!',
  circle: '⭕ Trace the Circle!',
  'left-slanting': '🛷 Trace the Left Slanting Line!',
  'right-slanting': '🛷 Trace the Right Slanting Line!',
  'left-curve': '🌀 Trace the Left Curve!',
  'right-curve': '🌀 Trace the Right Curve!',
  'up-curve': '🌈 Trace the Up Curve!',
  'down-curve': '🌈 Trace the Down Curve!',
  'letter-a': '🍎 Trace the Letter A!',
  'letter-b': '🏀 Trace the Letter B!',
  'letter-c': '🐱 Trace the Letter C!',
  'letter-d': '🐕 Trace the Letter D!',
  'letter-e': '🐘 Trace the Letter E!',
  'letter-f': '🐟 Trace the Letter F!',
  'letter-g': '🍇 Trace the Letter G!',
  'letter-h': '🎩 Trace the Letter H!',
  'letter-i': '🍦 Trace the Letter I!',
  'letter-j': '🏺 Trace the Letter J!',
  'letter-k': '🪁 Trace the Letter K!',
  'letter-l': '🦁 Trace the Letter L!',
  'letter-m': '🥭 Trace the Letter M!',
};

function addSeg(pts: { x: number; y: number }[], x1: number, y1: number, x2: number, y2: number, n: number) {
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push({ x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) }); }
}

const LETTER_SEGMENTS: Record<string, [number, number, number, number][]> = {
  'letter-a': [[0.2,0.9,0.5,0.1],[0.8,0.9,0.5,0.1],[0.35,0.6,0.65,0.6]],
  'letter-b': [[0.25,0.1,0.25,0.9],[0.25,0.1,0.65,0.1],[0.65,0.1,0.7,0.3],[0.7,0.3,0.65,0.48],[0.65,0.48,0.25,0.5],[0.25,0.5,0.65,0.52],[0.65,0.52,0.7,0.7],[0.7,0.7,0.65,0.9],[0.65,0.9,0.25,0.9]],
  'letter-c': [[0.7,0.15,0.4,0.1],[0.4,0.1,0.25,0.3],[0.25,0.3,0.25,0.7],[0.25,0.7,0.4,0.9],[0.4,0.9,0.7,0.85]],
  'letter-d': [[0.25,0.1,0.25,0.9],[0.25,0.1,0.6,0.1],[0.6,0.1,0.75,0.3],[0.75,0.3,0.75,0.7],[0.75,0.7,0.6,0.9],[0.6,0.9,0.25,0.9]],
  'letter-e': [[0.7,0.1,0.2,0.1],[0.2,0.1,0.2,0.9],[0.2,0.9,0.7,0.9],[0.2,0.5,0.6,0.5]],
  'letter-f': [[0.7,0.1,0.2,0.1],[0.2,0.1,0.2,0.9],[0.2,0.5,0.6,0.5]],
  'letter-g': [[0.7,0.15,0.4,0.1],[0.4,0.1,0.25,0.3],[0.25,0.3,0.25,0.7],[0.25,0.7,0.4,0.9],[0.4,0.9,0.7,0.85],[0.7,0.85,0.7,0.5],[0.7,0.5,0.55,0.5]],
  'letter-h': [[0.2,0.1,0.2,0.9],[0.8,0.1,0.8,0.9],[0.2,0.5,0.8,0.5]],
  'letter-i': [[0.5,0.1,0.5,0.9]],
  'letter-j': [[0.65,0.1,0.65,0.75],[0.65,0.75,0.55,0.88],[0.55,0.88,0.35,0.85]],
  'letter-k': [[0.25,0.1,0.25,0.9],[0.25,0.5,0.75,0.15],[0.25,0.5,0.75,0.85]],
  'letter-l': [[0.2,0.1,0.2,0.9],[0.2,0.9,0.8,0.9]],
  'letter-m': [[0.15,0.9,0.15,0.1],[0.15,0.1,0.5,0.5],[0.5,0.5,0.85,0.1],[0.85,0.1,0.85,0.9]],
  'letter-n': [[0.2,0.1,0.2,0.9],[0.2,0.1,0.8,0.9],[0.8,0.9,0.8,0.1]],
  'letter-o': [[0.25,0.1,0.8,0.1],[0.8,0.1,0.88,0.3],[0.88,0.3,0.88,0.7],[0.88,0.7,0.8,0.9],[0.8,0.9,0.25,0.9],[0.25,0.9,0.17,0.7],[0.17,0.7,0.17,0.3],[0.17,0.3,0.25,0.1]],
  'letter-p': [[0.3,0.1,0.3,0.9],[0.3,0.1,0.7,0.1],[0.7,0.1,0.8,0.25],[0.8,0.25,0.7,0.45],[0.7,0.45,0.3,0.5]],
  'letter-q': [[0.25,0.1,0.8,0.1],[0.8,0.1,0.88,0.3],[0.88,0.3,0.88,0.7],[0.88,0.7,0.8,0.9],[0.8,0.9,0.25,0.9],[0.25,0.9,0.17,0.7],[0.17,0.7,0.17,0.3],[0.17,0.3,0.25,0.1],[0.55,0.6,0.85,0.95]],
  'letter-r': [[0.25,0.1,0.25,0.9],[0.25,0.1,0.7,0.1],[0.7,0.1,0.8,0.25],[0.8,0.25,0.7,0.45],[0.7,0.45,0.25,0.5],[0.45,0.5,0.8,0.9]],
  'letter-s': [[0.78,0.15,0.52,0.1],[0.52,0.1,0.28,0.2],[0.28,0.2,0.32,0.4],[0.32,0.4,0.72,0.5],[0.72,0.5,0.78,0.7],[0.78,0.7,0.62,0.9],[0.62,0.9,0.32,0.85]],
  'letter-t': [[0.15,0.1,0.85,0.1],[0.5,0.1,0.5,0.9]],
  'letter-u': [[0.2,0.1,0.2,0.65],[0.2,0.65,0.35,0.85],[0.35,0.85,0.65,0.85],[0.65,0.85,0.8,0.65],[0.8,0.65,0.8,0.1]],
  'letter-v': [[0.15,0.1,0.5,0.85],[0.5,0.85,0.85,0.1]],
  'letter-w': [[0.1,0.1,0.25,0.85],[0.25,0.85,0.5,0.3],[0.5,0.3,0.75,0.85],[0.75,0.85,0.9,0.1]],
  'letter-x': [[0.15,0.1,0.85,0.9],[0.85,0.1,0.15,0.9]],
  'letter-y': [[0.15,0.1,0.5,0.5],[0.85,0.1,0.5,0.5],[0.5,0.5,0.5,0.9]],
  'letter-z': [[0.1,0.1,0.9,0.1],[0.9,0.1,0.1,0.9],[0.1,0.9,0.9,0.9]],
};

function generateDottedPath(pathType: string, w: number, h: number) {
  const pts: { x: number; y: number }[] = [];
  const count = 60;
  if (pathType === 's-curve') {
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: 40 + t * (w - 80), y: h / 2 + Math.sin(t * Math.PI * 2) * (h / 4) }); }
  } else if (pathType === 'circle') {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 3;
    for (let i = 0; i <= count; i++) { const a = (i / count) * Math.PI * 2; pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }
  } else if (pathType === 'standing') {
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: w / 2, y: 20 + t * (h - 40) }); }
  } else if (pathType === 'sleeping') {
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: 20 + t * (w - 40), y: h / 2 }); }
  } else if (pathType === 'slanting' || pathType === 'left-slanting') {
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: 20 + t * (w - 40), y: 20 + t * (h - 40) }); }
  } else if (pathType === 'right-slanting') {
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: w - 20 - t * (w - 40), y: 20 + t * (h - 40) }); }
  } else if (pathType === 'curved') {
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: 20 + t * (w - 40), y: h - 20 - Math.sin(t * Math.PI) * (h * 0.35) }); }
  } else if (pathType === 'up-curve') {
    // ∪ — dips DOWN from top (opens upward)
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: 20 + t * (w - 40), y: 20 + Math.sin(t * Math.PI) * (h * 0.38) }); }
  } else if (pathType === 'down-curve') {
    // ∩ — arches UP from bottom (opens downward)
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: 20 + t * (w - 40), y: h - 20 - Math.sin(t * Math.PI) * (h * 0.38) }); }
  } else if (pathType === 'left-curve') {
    // `(` — start right-edge top → bow left → end right-edge bottom
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: w - 20 - Math.sin(t * Math.PI) * (w * 0.35), y: 20 + t * (h - 40) }); }
  } else if (pathType === 'right-curve') {
    // `)` — start left-edge top → bow right → end left-edge bottom
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: 20 + Math.sin(t * Math.PI) * (w * 0.35), y: 20 + t * (h - 40) }); }
  } else if (pathType === 'zigzag') {
    const segs = 6;
    for (let i = 0; i <= count; i++) { const t = i / count; const seg = Math.floor(t * segs); const lt = (t * segs) - seg; pts.push({ x: 20 + t * (w - 40), y: seg % 2 === 0 ? 20 + lt * (h - 40) : h - 20 - lt * (h - 40) }); }
  } else if (LETTER_SEGMENTS[pathType]) {
    const segs = LETTER_SEGMENTS[pathType];
    const ptsPerSeg = Math.max(10, Math.floor(50 / segs.length));
    const padX = w * 0.08, padY = h * 0.05;
    for (const [x1, y1, x2, y2] of segs) {
      addSeg(pts, padX + x1 * (w - padX * 2), padY + y1 * (h - padY * 2), padX + x2 * (w - padX * 2), padY + y2 * (h - padY * 2), ptsPerSeg);
    }
  } else {
    for (let i = 0; i <= count; i++) { const t = i / count; pts.push({ x: 40 + t * (w - 80), y: h / 2 }); }
  }
  return pts;
}

export default function TraceActivity({ config, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);
  const startTime = useRef(Date.now());
  const [dottedPath, setDottedPath] = useState<{ x: number; y: number }[]>([]);
  const [dimensions, setDimensions] = useState({ w: 600, h: 200 });

  const pathType = (config.path as string) || 'sleeping';
  const traceColor = (config.color as string) || '#FF6B6B';
  const tolerance = (config.tolerance as number) || 20;
  const isGuide = (config.mode as string) === 'guide';
  const guideEmoji = GUIDE_EMOJIS[pathType] || '⭐';
  const actualPassThreshold = PASS_THRESHOLD;
  const guideDots = isGuide ? dottedPath.filter((_, i) => i % 4 === 0) : [];

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.max(Math.round(w * 0.35), 160);
        setDimensions({ w, h });
        setDottedPath(generateDottedPath(pathType, w, h));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [pathType]);

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
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setPoints([pos]);
  }, [done, getCanvasPos]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || done) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    setPoints(prev => [...prev, pos]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = traceColor;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }, [isDrawing, done, getCanvasPos, traceColor]);

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  const handleFinish = () => {
    if (done || points.length < 2) return;
    let correct = 0;
    for (const pt of points) {
      const near = dottedPath.some(d => {
        const dx = d.x - pt.x, dy = d.y - pt.y;
        return Math.sqrt(dx * dx + dy * dy) < tolerance;
      });
      if (near) correct++;
    }
    const accuracy = points.length > 0 ? Math.round((correct / points.length) * 100) : 0;
    const isPass = accuracy >= actualPassThreshold;
    setPassed(isPass);
    setDone(true);
    if (isPass) {
      onComplete({
        score: 100, max_score: 100,
        completion_data: { accuracy, points_traced: points.length, path_type: pathType },
        time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000),
      });
    }
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setPoints([]); setDone(false); setPassed(false); setIsDrawing(false);
    startTime.current = Date.now();
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-4 px-3 sm:px-6 pt-4 sm:pt-8 pb-3 sm:pb-6">
      <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-lg text-center">
        {isGuide ? GUIDE_HEADINGS[pathType] || `${guideEmoji} Trace the ${pathType} line!`
          : ({
            's-curve': '🖐️ Trace the Snake!',
            'circle': '🖐️ Trace the Circle!',
            'standing': '📏 Trace the Standing Line!',
            'sleeping': '🛏️ Trace the Sleeping Line!',
            'slanting': '📐 Trace the Slanting Line!',
            'curved': '🌈 Trace the Curved Line!',
            'zigzag': '⚡ Trace the Zig Zag!',
            'left-slanting': '📐 Trace the Left Slanting!',
            'right-slanting': '📐 Trace the Right Slanting!',
            'left-curve': '🌀 Trace the Left Curve!',
            'right-curve': '🌀 Trace the Right Curve!',
            'up-curve': '🌈 Trace the Up Curve!',
            'down-curve': '🌈 Trace the Down Curve!',
            'letter-a': '✏️ Trace Letter A!',
            'letter-b': '✏️ Trace Letter B!',
            'letter-c': '✏️ Trace Letter C!',
            'letter-d': '✏️ Trace Letter D!',
            'letter-e': '✏️ Trace Letter E!',
            'letter-f': '✏️ Trace Letter F!',
            'letter-g': '✏️ Trace Letter G!',
            'letter-h': '✏️ Trace Letter H!',
            'letter-i': '✏️ Trace Letter I!',
            'letter-j': '✏️ Trace Letter J!',
            'letter-k': '✏️ Trace Letter K!',
            'letter-l': '✏️ Trace Letter L!',
            'letter-m': '✏️ Trace Letter M!',
          }[pathType] || '🖐️ Trace the Pattern!')}
      </h3>

      <div ref={containerRef} className="w-full">
        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden touch-none border border-white/30 shadow-inner"
          style={{ height: dimensions.h, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}>

          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 cursor-crosshair w-full h-full"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />

          <svg width={dimensions.w} height={dimensions.h} className="absolute inset-0 z-0 pointer-events-none" preserveAspectRatio="none">
            {isGuide ? (
              <>
                {guideDots.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={6}
                    fill={i === 0 ? '#22C55E' : 'rgba(255,255,255,0.25)'}
                    stroke={i === 0 ? '#22C55E' : 'none'} strokeWidth={2}
                  />
                ))}
                <text x={guideDots[0]?.x || 0} y={(guideDots[0]?.y || 0) - 14}
                  fontSize="9" fill="#22C55E" fontWeight="900" textAnchor="middle">START ✓</text>
                <text x={guideDots[guideDots.length - 1]?.x || 0} y={(guideDots[guideDots.length - 1]?.y || 0) - 14}
                  fontSize="9" fill="#22C55E" fontWeight="900" textAnchor="middle">END ✨</text>
                <text x={guideDots[0]?.x || 0} y={(guideDots[0]?.y || 0)}
                  fontSize="14" textAnchor="middle" dominantBaseline="central">{guideEmoji}</text>
              </>
            ) : (
              dottedPath.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill="#CBD5E1" />
              ))
            )}
          </svg>

          {done && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-sm">
              <div className="rounded-xl sm:rounded-2xl px-5 sm:px-8 py-3 sm:py-4 shadow-xl text-center border border-white/40 backdrop-blur-md"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                {passed ? (
                  <>
                    <p className="text-2xl sm:text-3xl">⭐⭐⭐⭐⭐</p>
                    <p className="font-bold text-white text-sm sm:text-base">{isGuide ? `${guideEmoji} Great job!` : 'Great tracing! 🎉'}</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl sm:text-3xl">💪</p>
                    <p className="font-bold text-white text-sm sm:text-base">Almost! Try again!</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 sm:gap-3">
        {!done ? (
          <button onClick={handleFinish} disabled={points.length < 2}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white font-black rounded-full shadow-lg transition-all text-sm sm:text-base">
            Done! ✅
          </button>
        ) : passed ? (
          <button onClick={() => onComplete({ score: 100, max_score: 100, completion_data: {}, time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000) })}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-full shadow-lg transition-all text-sm sm:text-base">
            Next ➡️
          </button>
        ) : (
          <button onClick={handleReset}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-full shadow-lg transition-all text-sm sm:text-base">
            Try Again 🔄
          </button>
        )}
      </div>

      <p className="text-[9px] sm:text-xs font-bold text-white/50 text-center">
        {isGuide ? '👆 Drag your finger from START to END!' : 'Drag your finger along the dotted line, then tap Done!'}
      </p>
    </div>
  );
}
