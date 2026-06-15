'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  config?: { path?: string; color?: string };
  onComplete: (data: {
    score: number;
    max_score: number;
    completion_data: Record<string, unknown>;
    time_taken_seconds: number;
  }) => void;
};

/* ─── Path builders ─── */

function buildPath(pathType: string, w: number, h: number) {
  const pts: { x: number; y: number }[] = [];
  const steps = 60;
  const m = Math.max(24, w * 0.03);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    switch (pathType) {
      case 'standing':
        pts.push({ x: w / 2, y: h - m - t * (h - 2 * m) });
        break;
      case 'sleeping':
        pts.push({ x: m + t * (w - 2 * m), y: h / 2 });
        break;
      case 'slanting':
      case 'left-slanting':
        pts.push({ x: m + t * (w - 2 * m), y: h - m - t * (h - 2 * m) });
        break;
      case 'right-slanting':
        pts.push({ x: w - m - t * (w - 2 * m), y: h - m - t * (h - 2 * m) });
        break;
      case 'curved':
      case 'up-curve':
        pts.push({ x: m + t * (w - 2 * m), y: h - m - Math.sin(t * Math.PI) * h * 0.4 });
        break;
      case 'down-curve':
        pts.push({ x: m + t * (w - 2 * m), y: m + Math.sin(t * Math.PI) * h * 0.4 });
        break;
      case 'left-curve':
        pts.push({ x: w - m - Math.sin(t * Math.PI) * w * 0.3, y: m + t * (h - 2 * m) });
        break;
      case 'right-curve':
        pts.push({ x: m + Math.sin(t * Math.PI) * w * 0.3, y: m + t * (h - 2 * m) });
        break;
      case 'zigzag': {
        const segs = 5;
        const seg = Math.floor(t * segs);
        const lt = t * segs - seg;
        const x = m + t * (w - 2 * m);
        const y = seg % 2 === 0 ? m + lt * (h - 2 * m) : h - m - lt * (h - 2 * m);
        pts.push({ x, y });
        break;
      }
      case 's-curve':
        pts.push({ x: m + t * (w - 2 * m), y: h * 0.45 + Math.sin(t * Math.PI * 2) * h * 0.25 });
        break;
      case 'circle': {
        const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.33;
        const a = (i / steps) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        break;
      }
      default:
        pts.push({ x: m + t * (w - 2 * m), y: h / 2 });
    }
  }
  return pts;
}

/* ─── Per-path visual constants ─── */

interface PathVisual {
  label: string;
  emoji: string;
  color: string;
  // Animation duration in ms
  duration: number;
}

const PATH_VISUALS: Record<string, PathVisual> = {
  standing:       { label: 'Standing Line',   emoji: '⬆️', color: '#6366F1', duration: 4000 },
  sleeping:       { label: 'Sleeping Line',   emoji: '➡️', color: '#22C55E', duration: 4000 },
  'left-slanting':{ label: 'Left Slant',      emoji: '↗️', color: '#F59E0B', duration: 4000 },
  'right-slanting':{ label: 'Right Slant',    emoji: '↖️', color: '#F97316', duration: 4000 },
  'up-curve':     { label: 'Up Curve',        emoji: '🙂', color: '#06B6D4', duration: 4000 },
  'down-curve':   { label: 'Down Curve',      emoji: '🙃', color: '#10B981', duration: 4000 },
  'left-curve':   { label: 'Left Curve',      emoji: '🌀', color: '#8B5CF6', duration: 4000 },
  'right-curve':  { label: 'Right Curve',     emoji: '🌀', color: '#EC4899', duration: 4000 },
  zigzag:         { label: 'Zig Zag',         emoji: '⚡', color: '#EF4444', duration: 4500 },
  's-curve':      { label: 'Wavy Path',       emoji: '〰️', color: '#22c55e', duration: 5000 },
  circle:         { label: 'Circle',          emoji: '⭕', color: '#818cf8', duration: 5500 },
};

function getVisual(path: string): PathVisual {
  return PATH_VISUALS[path] || { label: path, emoji: '✏️', color: '#8B5CF6', duration: 4000 };
}

/* ─── Component ─── */

export default function PreWritingVideo({ config, onComplete }: Props) {
  const pathType = (config?.path as string) || 'sleeping';
  const visual = getVisual(pathType);

  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [trailD, setTrailD] = useState('');
  const [bgD, setBgD] = useState('');
  const doneRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const animRef = useRef(0);
  const rafStartRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const ptsRef = useRef<{ x: number; y: number }[]>([]);

  const isCircle = pathType === 'circle';
  const isSCurve = pathType === 's-curve';

  /* Build static background once */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const pts = buildPath(pathType, width, height);
    ptsRef.current = pts;
    // Background guide path (dotted)
    let bg = '';
    for (let i = 0; i < pts.length; i++) {
      bg += `${i === 0 ? 'M' : 'L'} ${pts[i].x} ${pts[i].y}`;
    }
    setBgD(bg);
  }, [pathType]);

  /* Animation loop */
  useEffect(() => {
    if (phase !== 'playing') return;
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width === 0 || height === 0) return;
    const pts = ptsRef.current.length > 0 ? ptsRef.current : buildPath(pathType, width, height);
    ptsRef.current = pts;
    if (pts.length < 2) return;

    const duration = visual.duration;
    rafStartRef.current = Date.now();
    doneRef.current = false;

    const tick = () => {
      const elapsed = Date.now() - rafStartRef.current!;
      const pct = Math.min(elapsed / duration, 1);
      setProgress(pct);

      // Interpolate position
      const total = pts.length - 1;
      const raw = pct * total;
      const idx = Math.min(Math.floor(raw), total - 1);
      const frac = raw - idx;
      const p0 = pts[idx];
      const p1 = pts[Math.min(idx + 1, total)];
      const x = p0.x + (p1.x - p0.x) * frac;
      const y = p0.y + (p1.y - p0.y) * frac;
      setPos({ x, y });

      // Build trail SVG path (~60% behind the dot)
      let d = '';
      const trailEnd = Math.floor(idx * 0.6);
      for (let i = 0; i <= trailEnd && i < pts.length; i++) {
        d += `${i === 0 ? 'M' : 'L'} ${pts[i].x} ${pts[i].y}`;
      }
      if (trailEnd >= 0 && frac > 0) {
        d += `L ${x} ${y}`;
      }
      setTrailD(d);

      if (pct >= 1) {
        if (doneRef.current) return;
        doneRef.current = true;
        setPhase('done');
      } else {
        animRef.current = requestAnimationFrame(tick);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [phase, pathType, visual.duration]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handlePlay = useCallback(() => {
    if (phase !== 'idle') return;
    setProgress(0);
    setPos({ x: 0, y: 0 });
    setTrailD('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }, [phase]);

  const handleReplay = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    doneRef.current = false;
    setProgress(0);
    setPos({ x: 0, y: 0 });
    setTrailD('');
    startTimeRef.current = Date.now();
    setPhase('playing');
  }, []);

  const handleComplete = useCallback(() => {
    onComplete({
      score: 100,
      max_score: 100,
      completion_data: { watched: true, path: pathType },
      time_taken_seconds: Math.round((Date.now() - startTimeRef.current) / 1000),
    });
  }, [onComplete, pathType]);

  const elapsed = Math.max(0, Math.min(progress, 1));

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 px-3 sm:px-4 pt-3 sm:pt-4 pb-3 sm:pb-4 select-none">
      {/* Title bar */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
          <span className="text-base sm:text-xl shrink-0">{visual.emoji}</span>
          <h3 className="text-sm sm:text-base font-bold text-white/90 truncate drop-shadow-sm">
            {visual.label}
          </h3>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold text-white/40 tracking-wider uppercase shrink-0">
          Guide
        </span>
      </div>

      {/* Video area */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg sm:rounded-xl overflow-hidden"
        style={{
          aspectRatio: isCircle ? '1/1' : '16/9',
          background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />

        {/* Background guide path (dotted reference) */}
        {bgD && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <path
              d={bgD}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={isCircle ? 1.5 : 1}
              strokeDasharray={isCircle ? '4 4' : '3 3'}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        {/* Trail glow */}
        {phase === 'playing' && trailD && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <defs>
              <filter id={`glow-${pathType}`}>
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d={trailD}
              fill="none"
              stroke={visual.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
              filter={`url(#glow-${pathType})`}
            />
          </svg>
        )}

        {/* Glow behind dot */}
        {phase === 'playing' && (
          <div
            className="absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: pos.x,
              top: pos.y,
              background: `radial-gradient(circle, ${visual.color}40 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Animated dot */}
        {phase === 'playing' && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: pos.x, top: pos.y }}
          >
            <motion.div
              className="rounded-full"
              style={{
                width: isCircle ? 14 : 12,
                height: isCircle ? 14 : 12,
                background: visual.color,
                boxShadow: `0 0 12px ${visual.color}80, 0 0 30px ${visual.color}30`,
              }}
              animate={isSCurve ? {
                scale: [1, 1.15, 1],
              } : undefined}
              transition={isSCurve ? { duration: 0.8, repeat: Infinity } : undefined}
            />
          </div>
        )}

        {/* Play button */}
        <AnimatePresence>
          {phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
              onClick={handlePlay}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${visual.color}, ${visual.color}dd)`,
                    boxShadow: `0 8px 32px ${visual.color}50`,
                  }}
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="ml-0.5 sm:ml-1 sm:w-6 sm:h-6">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.div>
                <span
                  className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase"
                  style={{ color: `${visual.color}cc` }}
                >
                  Tap to Watch
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completion overlay */}
        <AnimatePresence>
          {phase === 'done' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 18 }}
                className="rounded-xl sm:rounded-2xl px-5 sm:px-8 py-4 sm:py-6 mx-4 text-center backdrop-blur-lg"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <motion.div
                  className="text-xl sm:text-2xl mb-1.5"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  ✓
                </motion.div>
                <p className="text-sm sm:text-base font-bold text-white/90">{visual.label}</p>
                <p
                  className="text-[10px] sm:text-xs font-semibold tracking-widest mt-0.5"
                  style={{ color: `${visual.color}aa` }}
                >
                  DEMO COMPLETE
                </p>
                <div className="flex gap-2 justify-center mt-3">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleReplay}
                    className="px-4 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    Replay
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleComplete}
                    className="px-4 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg transition-all"
                    style={{
                      background: visual.color,
                      color: '#fff',
                      boxShadow: `0 4px 16px ${visual.color}40`,
                    }}
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress bar */}
        {phase === 'playing' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
            <motion.div
              className="h-full"
              style={{
                width: `${elapsed * 100}%`,
                background: `linear-gradient(90deg, ${visual.color}88, ${visual.color})`,
                boxShadow: `0 0 8px ${visual.color}60`,
              }}
            />
          </div>
        )}
      </div>

      {/* Status text */}
      <p
        className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.15em] text-center px-2"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {phase === 'idle'
          ? 'Tap to see how it\'s done'
          : phase === 'playing'
          ? 'Watch the guide...'
          : 'Got it! Ready to trace'}
      </p>
    </div>
  );
}
