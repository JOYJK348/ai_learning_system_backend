'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
};

const STAGES = [
  { pct: 15, fs: 14 },
  { pct: 24, fs: 18 },
  { pct: 35, fs: 22 },
  { pct: 48, fs: 26 },
];

export default function VideoBalloon({ onComplete }: Props) {
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState(0);
  const doneRef = useRef(false);
  const startTime = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handlePlay = () => {
    if (started) return;
    setStarted(true);
    startTime.current = Date.now();
  };

  useEffect(() => {
    if (!started) return;
    if (phase >= 4) {
      if (doneRef.current) return;
      doneRef.current = true;
      onCompleteRef.current({
        score: 100,
        max_score: 100,
        completion_data: { watched: true },
        time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000),
      });
      return;
    }
    const timer = setTimeout(() => setPhase(p => p + 1), 1000);
    return () => clearTimeout(timer);
  }, [started, phase]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:gap-5 px-3 sm:px-6 pt-4 sm:pt-8 pb-3 sm:pb-6">
      <h3 className="text-lg sm:text-3xl font-black tracking-tighter flex items-center gap-2 sm:gap-3 text-white drop-shadow-lg">
        <span className="text-lg sm:text-2xl">🎈</span>
        <span>WATCH THE BALLOON BLOW</span>
      </h3>

      <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-inner border border-white/20 min-h-[200px] sm:min-h-0"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))' }}>
        <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] sm:h-56 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="50" y1="22" x2="50" y2="82" stroke="white" strokeWidth="0.3" strokeDasharray="1 0.8" opacity="0.3" vectorEffect="non-scaling-stroke" />
          </svg>

          <AnimatePresence>
            {!started && !doneRef.current && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/10 backdrop-blur-[2px] cursor-pointer"
                onClick={handlePlay}
              >
                <motion.div
                  whileTap={{ scale: 0.92 }}
                  className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full shadow-[0_10px_30px_rgba(168,85,247,0.4)] flex items-center justify-center border-[3px] border-white/80"
                >
                  <span className="text-lg sm:text-3xl text-white ml-0.5 drop-shadow-lg">▶</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {started && phase < 4 && (
            <motion.div
              key={phase}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 10 }}
              className="relative z-10 flex items-center justify-center"
            >
              <div
                className="rounded-[50%] flex items-center justify-center border-[3px] border-white/70"
                style={{
                  width: `${STAGES[phase].pct}%`,
                  paddingBottom: `${STAGES[phase].pct * 1.15}%`,
                  background: 'radial-gradient(circle at 35% 28%, #FDE68A, #EC4899)',
                  boxShadow: '0 8px 25px rgba(236,72,153,0.25)',
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: STAGES[phase].fs }}>
                  🎈
                </span>
              </div>
            </motion.div>
          )}

          {phase === 4 && (
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1.8, opacity: [0, 1, 0] }}
              transition={{ duration: 0.9 }}
              className="absolute z-20"
            >
              <span className="text-4xl sm:text-7xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]">💥</span>
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
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-3xl sm:text-5xl block mb-1"
                  >🎈</motion.span>
                  <p className="font-black text-sm sm:text-lg tracking-tight text-white">Balloon blew up!</p>
                  <p className="text-[7px] sm:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 text-white/50">POP COMPLETE!</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full h-1.5 sm:h-2.5 bg-white/15 rounded-full overflow-hidden border border-white/10">
        <motion.div className="h-full rounded-full"
          style={{
            width: `${(Math.min(phase, 4) / 4) * 100}%`,
            background: 'linear-gradient(90deg, #c084fc, #ec4899)',
            boxShadow: '0 0 12px rgba(168,85,247,0.5)',
          }}
        />
      </div>

      <p className="text-[9px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center px-2 text-white/50">
        {!started ? '👆 TAP TO START' : phase < 4 ? '🌀 WATCH THE BALLOON GROW...' : '✨ POP!'}
      </p>
    </div>
  );
}
