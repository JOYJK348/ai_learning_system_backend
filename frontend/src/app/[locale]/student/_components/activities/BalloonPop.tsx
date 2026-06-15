'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLetterData, shuffle } from '@/core/data/letterData';

type Props = {
  config: { mode?: string; letters?: string[] };
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
};

const ALL_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

const POSITIONS = [
  'left-[5%] top-[10%]', 'left-[35%] top-[5%]', 'left-[65%] top-[12%]',
  'left-[10%] top-[40%]', 'left-[55%] top-[38%]',
  'left-[20%] top-[65%]', 'left-[70%] top-[60%]',
  'left-[40%] top-[70%]',
];

export default function BalloonPop({ config, onComplete }: Props) {
  const lessonLetters = useMemo(() => {
    const raw = (config.letters || ['A','B','C','D','E','F']).slice(0, 6);
    const unique = [...new Set(raw)];
    if (unique.length < 6) {
      const pool = ALL_LETTERS.filter(l => !unique.includes(l));
      const extras = shuffle(pool).slice(0, 6 - unique.length);
      return shuffle([...unique, ...extras]);
    }
    return shuffle(unique);
  }, [config.letters]);

  const [queue] = useState(() => shuffle(lessonLetters));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [popped, setPopped] = useState<Set<string>>(new Set());
  const [showWrong, setShowWrong] = useState(false);
  const [done, setDone] = useState(false);
  const startTime = useRef(Date.now());

  const currentLetter = queue[currentIdx];
  const currentData = getLetterData(currentLetter);

  const positions = useMemo(() =>
    queue.map((l, i) => {
      const d = getLetterData(l);
      return {
        letter: l, emoji: d.emoji, color: d.color,
        className: POSITIONS[i % POSITIONS.length],
        delay: i * 0.12,
      };
    }),
  [queue]);

  const handlePop = (letter: string) => {
    if (popped.has(letter) || done) return;
    if (letter === currentLetter) {
      setPopped(prev => new Set(prev).add(letter));
      setShowWrong(false);
      setTimeout(() => {
        if (currentIdx < queue.length - 1) setCurrentIdx(i => i + 1);
        else setDone(true);
      }, 500);
    } else {
      setShowWrong(true);
      setTimeout(() => setShowWrong(false), 500);
    }
  };

  if (done) {
    const score = popped.size;
    return (
      <div className="flex flex-col items-center gap-6 px-6 py-10">
        <motion.span animate={{ rotate: [0,10,-10,0], scale: [1,1.15,1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-7xl">🎈</motion.span>
        <h2 className="text-3xl font-black text-white drop-shadow-lg text-center">Balloon Champ!</h2>
        <p className="text-lg font-bold text-white/70 text-center">Popped {score}/{queue.length} balloons!</p>
        <motion.button whileTap={{ scale: 0.92 }}
          onClick={() => onComplete({ score: Math.round((score/queue.length)*100), max_score: 100, completion_data: { popped: score, total: queue.length }, time_taken_seconds: Math.round((Date.now()-startTime.current)/1000) })}
          className="px-10 py-4 bg-white/25 backdrop-blur-md text-white font-black text-lg rounded-full border-2 border-white/40">Next ➡️</motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6">
      <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-lg text-center">
        🎈 Pop the <span className="text-yellow-200">{currentData.emoji}</span> balloon!
      </h3>

      <div className="flex items-center gap-1.5 mb-2">
        {queue.map((l, i) => (
          <div key={l+i} className={`w-2.5 h-2.5 rounded-full ${popped.has(l)||i<currentIdx?'bg-green-400':i===currentIdx?'bg-white':'bg-white/30'}`} />
        ))}
      </div>

      <div className="relative w-full h-[320px] sm:h-[380px]">
        <AnimatePresence>
          {positions.map(({ letter, emoji, color, className, delay }) =>
            !popped.has(letter) && (
              <motion.button key={letter}
                initial={{ scale: 0 }}
                animate={{ scale: 1, y: [0, -6, 0] }}
                transition={{ scale: { delay, type:'spring', stiffness: 200 }, y: { delay: delay+0.5, duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => handlePop(letter)}
                className={`absolute ${className} flex flex-col items-center gap-1 cursor-pointer drop-shadow-xl`}
              >
                <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-xl border-[3px] border-white/50" style={{ background: color }}>
                  <span className="drop-shadow-md">{emoji}</span>
                </div>
                <span className="text-[9px] font-black text-white/60">{letter}</span>
              </motion.button>
            )
          )}
        </AnimatePresence>

        {showWrong && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.span animate={{ x: [0,-10,10,-5,5,0] }} transition={{ duration: 0.4 }} className="text-xl font-black text-yellow-200 bg-black/40 px-6 py-3 rounded-2xl">
              🙅 Not that one!
            </motion.span>
          </motion.div>
        )}
      </div>

      <p className="text-[10px] font-bold text-white/50 text-center">👆 Tap the {currentData.emoji} balloon!</p>
    </div>
  );
}
