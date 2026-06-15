'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
};

function buildCircle(w: number, h: number) {
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.38;
  const pts: { x: number; y: number }[] = [];
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

export default function VideoCircle({ onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const [bgD, setBgD] = useState('');
  const [trailD, setTrailD] = useState('');
  const doneRef = useRef(false);
  const startTime = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  const animRef = useRef<number>(0);
  const startAnimRef = useRef<number>(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  onCompleteRef.current = onComplete;

  const handlePlay = () => {
    if (started) return;
    setStarted(true);
    setProgress(0);
    startTime.current = Date.now();
  };

  const handleReplay = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    doneRef.current = false;
    setDotPos({ x: 0, y: 0 });
    setTrailD('');
    setProgress(0);
    setStarted(true);
    startTime.current = Date.now();
    setReplayKey(k => k + 1);
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pts = buildCircle(w, h);
    let bg = '';
    for (let i = 0; i < pts.length; i++) {
      bg += `${i === 0 ? 'M' : 'L'} ${pts[i].x} ${pts[i].y}`;
    }
    setBgD(bg);
  }, []);

  useEffect(() => {
    if (!started) return;
    const el = canvasRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pts = buildCircle(w, h);

    const duration = 6000;
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
      setDotPos({ x, y });
      setProgress(pct);

      let d = '';
      const trailEnd = Math.floor(idx);
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
      } else {
        animRef.current = requestAnimationFrame(tick);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [started, replayKey]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:gap-5 px-3 sm:px-6 pt-4 sm:pt-8 pb-3 sm:pb-6">
      <h3 className="text-lg sm:text-3xl font-black tracking-tighter flex items-center gap-2 sm:gap-3 text-white drop-shadow-lg">
        <span className="text-lg sm:text-2xl">⭕</span>
        <span>WATCH THE CIRCLE</span>
      </h3>

      <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-inner border border-white/20"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))' }}>
        <div ref={canvasRef}
          className="relative w-full aspect-[1/1] sm:aspect-[2/1] min-h-[200px] sm:min-h-0 rounded-xl sm:rounded-2xl overflow-hidden">
          {/* Background dotted circle */}
          {bgD && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path d={bgD} fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.25" strokeLinecap="round" />
            </svg>
          )}

          {/* Glow trail */}
          {started && !doneRef.current && trailD && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.6))' }}>
              <path d={trailD} fill="none" stroke="#818cf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
            </svg>
          )}

          {/* Radial glow at bug position */}
          {started && !doneRef.current && (
            <motion.div
              className="absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: dotPos.x, top: dotPos.y,
                background: 'radial-gradient(circle, rgba(99,102,241,0.35), transparent)',
              }}
            />
          )}

          {/* Play button overlay */}
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
                  style={{ background: 'linear-gradient(145deg, #818cf8, #6366f1)', boxShadow: '0 10px 40px rgba(99,102,241,0.4)' }}
                >
                  <span className="text-lg sm:text-3xl text-white ml-0.5 drop-shadow-lg">▶</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bug emoji following the circle */}
          {started && !doneRef.current && (
            <motion.div
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: dotPos.x, top: dotPos.y }}
            >
              <div className="relative" style={{ fontSize: 'clamp(1.3rem,5vw,2.5rem)' }}>
                <span>🐞</span>
                <motion.div
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ background: '#818cf8', boxShadow: '0 0 6px rgba(99,102,241,0.6)' }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              </div>
            </motion.div>
          )}

          {/* Completion overlay */}
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
                    animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-3xl sm:text-5xl block mb-1"
                  >⭕</motion.span>
                  <p className="font-black text-sm sm:text-lg tracking-tight text-white">Full circle done!</p>
                  <p className="text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 text-white/50">LOOP COMPLETE!</p>
                    <div className="flex gap-2 justify-center">
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
                          completion_data: { watched: true },
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

      <div className="w-full h-1.5 sm:h-2.5 bg-white/15 rounded-full overflow-hidden border border-white/10">
        <motion.div className="h-full rounded-full"
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #a5b4fc, #818cf8, #6366f1)',
            boxShadow: '0 0 12px rgba(99,102,241,0.5)',
          }}
        />
      </div>

      <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center px-2 text-white/50">
        {!started ? '👆 TAP TO WATCH THE CIRCLE!' : !doneRef.current ? '🐞 BUG IS GOING AROUND...' : '✨ FULL LOOP COMPLETE!'}
      </p>
    </div>
  );
}
