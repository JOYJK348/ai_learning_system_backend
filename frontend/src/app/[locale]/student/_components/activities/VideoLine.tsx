'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  config: { path?: string; color?: string };
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
};

const EMOJIS: Record<string, string> = {
  standing: '🐛', sleeping: '🚗', slanting: '🛷', curved: '🦋', zigzag: '🐇',
  'left-slanting': '🛷', 'right-slanting': '🛷',
  'left-curve': '🌀', 'right-curve': '🌀', 'up-curve': '🌈', 'down-curve': '🌈',
};
const TITLES: Record<string, string> = {
  standing: 'WATCH THE CATERPILLAR CLIMB',
  sleeping: 'WATCH THE CAR DRIVE',
  slanting: 'WATCH THE SLED SLIDE',
  curved: 'WATCH THE BUTTERFLY FLY',
  zigzag: 'WATCH THE BUNNY HOP',
  'left-slanting': 'WATCH THE SLED SLIDE',
  'right-slanting': 'WATCH THE SLED SLIDE BACK',
  'left-curve': 'WATCH THE SWIRL',
  'right-curve': 'WATCH THE SWIRL',
  'up-curve': 'WATCH THE SMILE',
  'down-curve': 'WATCH THE ARCH',
};
const TRAIL_COLORS: Record<string, string> = {
  standing: '#6366F1', sleeping: '#22C55E', slanting: '#F59E0B', curved: '#EC4899', zigzag: '#EF4444',
  'left-slanting': '#F59E0B', 'right-slanting': '#F97316',
  'left-curve': '#8B5CF6', 'right-curve': '#EC4899', 'up-curve': '#06B6D4', 'down-curve': '#10B981',
};
const FINISH_LABELS: Record<string, string> = {
  standing: 'Caterpillar climbed up!',
  sleeping: 'Car drove across!',
  slanting: 'Sled slid down!',
  curved: 'Butterfly flew by!',
  zigzag: 'Bunny hopped through!',
  'left-slanting': 'Sled slid down!',
  'right-slanting': 'Sled slid back!',
  'left-curve': 'Swirl done!',
  'right-curve': 'Swirl done!',
  'up-curve': 'Smile traced!',
  'down-curve': 'Arch traced!',
};

function buildPath(pathType: string, w: number, h: number) {
  const pts: { x: number; y: number }[] = [];
  const steps = 60;
  const m = 12;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (pathType === 'standing') {
      pts.push({ x: w / 2, y: h - m - t * (h - 2 * m) });
    } else if (pathType === 'sleeping') {
      pts.push({ x: m + t * (w - 2 * m), y: h / 2 });
    } else if (pathType === 'slanting' || pathType === 'left-slanting') {
      pts.push({ x: m + t * (w - 2 * m), y: h - m - t * (h - 2 * m) });
    } else if (pathType === 'right-slanting') {
      pts.push({ x: w - m - t * (w - 2 * m), y: h - m - t * (h - 2 * m) });
    } else if (pathType === 'curved' || pathType === 'up-curve') {
      pts.push({ x: m + t * (w - 2 * m), y: h - m - Math.sin(t * Math.PI) * (h * 0.45) });
    } else if (pathType === 'down-curve') {
      pts.push({ x: m + t * (w - 2 * m), y: m + Math.sin(t * Math.PI) * (h * 0.45) });
    } else if (pathType === 'left-curve') {
      // ( — right-edge top, bow left, right-edge bottom
      pts.push({ x: w - m - Math.sin(t * Math.PI) * (w * 0.35), y: m + t * (h - 2 * m) });
    } else if (pathType === 'right-curve') {
      // ) — left-edge top, bow right, left-edge bottom
      pts.push({ x: m + Math.sin(t * Math.PI) * (w * 0.35), y: m + t * (h - 2 * m) });
    } else if (pathType === 'zigzag') {
      const segs = 5;
      const seg = Math.floor(t * segs);
      const lt = (t * segs) - seg;
      const x = m + t * (w - 2 * m);
      const y = seg % 2 === 0 ? m + lt * (h - 2 * m) : h - m - lt * (h - 2 * m);
      pts.push({ x, y });
    } else {
      pts.push({ x: m + t * (w - 2 * m), y: h / 2 });
    }
  }
  return pts;
}

export default function VideoLine({ config, onComplete }: Props) {
  const pathType = (config.path as string) || 'sleeping';
  const [started, setStarted] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [trailD, setTrailD] = useState('');
  const doneRef = useRef(false);
  const startTime = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  const animRef = useRef<number>(0);
  const startAnimRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const ptsRef = useRef<{ x: number; y: number }[]>([]);
  onCompleteRef.current = onComplete;

  const emoji = EMOJIS[pathType] || '⭐';
  const title = TITLES[pathType] || 'WATCH THE LINE';
  const trailColor = TRAIL_COLORS[pathType] || '#8B5CF6';

  const handlePlay = () => {
    if (started) return;
    setStarted(true);
    startTime.current = Date.now();
  };

  const handleReplay = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    doneRef.current = false;
    setPos({ x: 0, y: 0 });
    setTrailD('');
    setStarted(true);
    startTime.current = Date.now();
    setReplayKey(k => k + 1);
  };

  useEffect(() => {
    if (!started) return;
    const container = containerRef.current;
    if (!container) return;
    const w = container.offsetWidth;
    const h = container.offsetHeight;
    const pts = buildPath(pathType, w, h);
    ptsRef.current = pts;
    const duration = 5000;
    startAnimRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startAnimRef.current!;
      const pct = Math.min(elapsed / duration, 1);
      const total = pts.length - 1;
      const raw = pct * total;
      const idx = Math.min(Math.floor(raw), total - 1);
      const frac = raw - idx;
      const p0 = pts[idx];
      const p1 = pts[Math.min(idx + 1, total)];
      const x = p0.x + (p1.x - p0.x) * frac;
      const y = p0.y + (p1.y - p0.y) * frac;
      setPos({ x, y });

      let d = '';
      const trailCount = Math.floor(idx * 0.6);
      for (let i = 0; i <= trailCount && i < pts.length; i++) {
        d += `${i === 0 ? 'M' : 'L'} ${pts[i].x} ${pts[i].y}`;
      }
      if (trailCount > 0 && frac > 0) {
        d += `L ${x} ${y}`;
      }
      setTrailD(d);

      if (pct >= 1) {
        if (doneRef.current) return;
        doneRef.current = true;
      } else {
        animRef.current = requestAnimationFrame(tick);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [started, pathType, replayKey]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:gap-5 px-3 sm:px-6 pt-4 sm:pt-8 pb-3 sm:pb-6">
      <h3 className="text-lg sm:text-3xl font-black tracking-tighter flex items-center gap-2 sm:gap-3 text-white drop-shadow-lg">
        <span className="text-lg sm:text-2xl">{emoji}</span>
        <span>{title}</span>
      </h3>

      <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-inner border border-white/20"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))' }}>
        <div ref={containerRef}
          className="relative w-full aspect-[16/9] sm:aspect-[3/1] min-h-[160px] sm:min-h-0 rounded-xl sm:rounded-2xl overflow-hidden">

          {started && !doneRef.current && trailD && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: `drop-shadow(0 0 6px ${trailColor}40)` }}>
              <path d={trailD} fill="none" stroke={trailColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            </svg>
          )}

          {started && !doneRef.current && (
            <motion.div
              className="absolute w-5 h-5 sm:w-7 sm:h-7 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: pos.x, top: pos.y,
                background: `radial-gradient(circle, ${trailColor}60, transparent)`,
              }}
            />
          )}

          <AnimatePresence>
            {!started && !doneRef.current && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer"
                style={{ background: 'rgba(0,0,0,0.08)' }}
                onClick={handlePlay}
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border-[3px] border-white/80"
                  style={{
                    background: `linear-gradient(145deg, ${trailColor}, ${trailColor}cc)`,
                    boxShadow: `0 10px 40px ${trailColor}60`,
                  }}
                >
                  <span className="text-lg sm:text-3xl text-white ml-0.5 drop-shadow-lg">▶</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {started && !doneRef.current && (
            <motion.div
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.x, top: pos.y }}
            >
              <div className="relative" style={{ fontSize: 'clamp(1.2rem,5vw,2.5rem)' }}>
                <span>{emoji}</span>
                <motion.div
                  className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full"
                  style={{ background: trailColor, boxShadow: `0 0 6px ${trailColor}` }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {doneRef.current && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex items-center justify-center"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05))' }}
              >
                <motion.div
                  initial={{ scale: 0.8, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="rounded-2xl sm:rounded-[2rem] px-5 sm:px-8 py-4 sm:py-6 shadow-2xl border-2 text-center mx-3 sm:mx-6 backdrop-blur-md"
                  style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.4)' }}
                >
                  <motion.span
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-3xl sm:text-5xl block mb-1"
                  >{emoji}</motion.span>
                  <p className="font-black text-sm sm:text-lg tracking-tight text-white">{FINISH_LABELS[pathType] || 'Line done!'}</p>
                  <p className="text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 text-white/50">LINE COMPLETE!</p>
                  <div className="mt-3 flex gap-2 justify-center">
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={handleReplay}
                      className="px-5 sm:px-6 py-2 sm:py-2.5 bg-white/15 backdrop-blur-md text-white font-black text-xs sm:text-sm rounded-full border-2 border-white/30 hover:bg-white/25 transition-all"
                    >
                      🔄 Replay
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => onCompleteRef.current({
                        score: 100, max_score: 100,
                        completion_data: { watched: true, path: pathType },
                        time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000),
                      })}
                      className="px-5 sm:px-6 py-2 sm:py-2.5 bg-white/25 backdrop-blur-md text-white font-black text-xs sm:text-sm rounded-full border-2 border-white/40 hover:bg-white/35 transition-all"
                    >
                      Next ➡️
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center px-2 text-white/50">
        {!started ? '👆 TAP TO WATCH!' : !doneRef.current ? `✨ FOLLOW THE ${pathType.toUpperCase()} PATH...` : '✨ GREAT! YOU WATCHED THE DEMO!'}
      </p>
    </div>
  );
}
