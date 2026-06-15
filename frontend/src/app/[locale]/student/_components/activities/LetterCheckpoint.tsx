'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { studentKeys } from '@/core/services/studentApi';
import { getLetterData, shuffle } from '@/core/data/letterData';

type Props = {
  lessonId: string;
  lessonTitle: string;
  onComplete: () => void;
  onClose: () => void;
};

const A_TO_M = ['A','B','C','D','E','F','G','H','I','J','K','L','M'];

/* ─── Game 1: Find the Letter ─── */
function FindLetter({ onDone }: { onDone: () => void }) {
  const [queue] = useState(() => shuffle([...A_TO_M]).slice(0, 6));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

  const current = queue[idx];
  const data = getLetterData(current);
  const options = useMemo(() => {
    const pool = A_TO_M.filter(l => l !== current);
    return shuffle([current, pool[Math.floor(Math.random() * pool.length)]]);
  }, [current]);

  const handleTap = (l: string) => {
    if (flash) return;
    if (l === current) {
      setFlash('correct');
      setScore(s => s + 1);
      setTimeout(() => {
        setFlash(null);
        idx < queue.length - 1 ? setIdx(i => i + 1) : onDone();
      }, 700);
    } else {
      setFlash('wrong');
      setTimeout(() => setFlash(null), 500);
    }
  };

  return (
    <div className="px-4 pt-3 pb-5 text-center">
      <p className="text-base sm:text-lg font-black text-indigo-800/70 mb-2">🔍 Find the letter</p>
      <motion.span key={current} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'tween', duration: 0.3 }}
        className="text-6xl sm:text-7xl block mb-3">{data.emoji}</motion.span>
      <div className="flex gap-3 justify-center">
        {options.map(l => {
          const d = getLetterData(l);
          const isCorrect = flash === 'correct' && l === current;
          const isWrong = flash === 'wrong';
          return (
            <motion.button key={l} whileTap={{ scale: 0.92 }} onClick={() => handleTap(l)}
              className="w-28 sm:w-32 h-28 sm:h-32 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg"
              style={{
                background: isCorrect ? 'linear-gradient(135deg, #22C55E, #16A34A)' : isWrong ? 'linear-gradient(135deg, #EF4444, #DC2626)' : `linear-gradient(135deg, ${d.color}dd, ${d.color}88)`,
                border: '3px solid rgba(255,255,255,0.25)',
                boxShadow: isCorrect ? '0 0 30px rgba(34,197,94,0.5)' : isWrong ? '0 0 30px rgba(239,68,68,0.5)' : '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <span className="text-2xl sm:text-3xl">{d.emoji}</span>
              <span className="text-xs sm:text-sm font-black text-white/80">{l}</span>
            </motion.button>
          );
        })}
      </div>
      {flash === 'wrong' && <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold text-yellow-700 mt-3">Not that one! 💪</motion.p>}
      <div className="flex justify-center gap-1.5 mt-3">
        {queue.map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < idx ? 'bg-green-400' : i === idx ? 'bg-white' : 'bg-white/30'}`} />)}
      </div>
    </div>
  );
}

/* ─── Game 2: Pop the Balloon ─── */
function PopBalloon({ onDone }: { onDone: () => void }) {
  const [queue] = useState(() => shuffle([...A_TO_M]).slice(0, 6));
  const [idx, setIdx] = useState(0);
  const [popped, setPopped] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

  const current = queue[idx];
  const positions = useMemo(() =>
    queue.map((l, i) => {
      const d = getLetterData(l);
      const x = [5, 28, 52, 75, 14, 45][i % 6];
      const y = [12, 8, 35, 50, 22, 48][i % 6];
      return { letter: l, color: d.color, x, y };
    }), [queue]);

  const handlePop = (l: string) => {
    if (flash || popped.has(l)) return;
    if (l === current) {
      setFlash('correct');
      const next = new Set(popped); next.add(l);
      setPopped(next);
      setTimeout(() => {
        setFlash(null);
        idx < queue.length - 1 ? setIdx(i => i + 1) : onDone();
      }, 500);
    } else {
      setFlash('wrong');
      setTimeout(() => setFlash(null), 500);
    }
  };

  return (
    <div className="px-3 pt-2 pb-3 text-center">
      <p className="text-base sm:text-lg font-black text-indigo-800/70 mb-1">🎈 Pop <span className="text-yellow-500">{current}</span> balloons!</p>
      <div className="relative w-full h-[280px]">
        {positions.map(({ letter, color, x, y }) => !popped.has(letter) && (
          <motion.button key={letter} initial={{ scale: 0 }} animate={{ scale: 1, y: [0, -5, 0] }}
            transition={{ scale: { type: 'tween', duration: 0.3 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
            whileTap={{ scale: 0.85 }} onClick={() => handlePop(letter)} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
            <svg width="76" height="96" viewBox="0 0 76 96" className="drop-shadow-xl">
              <path d="M38 80 Q 35 90 33 96" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <ellipse cx="38" cy="42" rx="26" ry="32" fill={color} />
              <path d="M 38 10 Q 18 14 14 32 Q 10 50 18 62 Q 24 72 36 74" fill={color} />
              <path d="M 38 10 Q 58 14 62 32 Q 66 50 58 62 Q 52 72 40 74" fill={color} />
              <ellipse cx="30" cy="30" rx="9" ry="13" fill="white" opacity="0.3" transform="rotate(-15, 30, 30)" />
              <polygon points="36,74 40,74 39,80 37,80" fill={color} />
              <text x="38" y="48" textAnchor="middle" fontSize="26" fontWeight="900" fill="white" opacity="0.95" stroke="rgba(0,0,0,0.15)" strokeWidth="1">{letter}</text>
            </svg>
          </motion.button>
        ))}
        {flash === 'wrong' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-sm font-bold text-yellow-700 bg-white/70 px-5 py-3 rounded-xl shadow-md">🙅 Oops!</span></div>}
      </div>
      <div className="flex justify-center gap-1.5 mt-1">
        {queue.map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < idx ? 'bg-green-400' : i === idx ? 'bg-white' : 'bg-white/30'}`} />)}
      </div>
    </div>
  );
}

/* ─── Game 3: Pick the Card ─── */
function PickCard({ onDone }: { onDone: () => void }) {
  const [queue] = useState(() => shuffle([...A_TO_M]).slice(0, 6));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null);

  const current = queue[idx];
  const data = getLetterData(current);
  const options = useMemo(() => {
    const pool = A_TO_M.filter(l => l !== current);
    return shuffle([current, ...shuffle(pool).slice(0, 2)]);
  }, [current]);

  const handleTap = (l: string) => {
    if (flash) return;
    if (l === current) {
      setFlash('correct');
      setScore(s => s + 1);
      setTimeout(() => {
        setFlash(null);
        idx < queue.length - 1 ? setIdx(i => i + 1) : onDone();
      }, 700);
    } else {
      setFlash('wrong');
      setTimeout(() => setFlash(null), 500);
    }
  };

  return (
    <div className="px-4 pt-3 pb-5 text-center">
      <p className="text-base sm:text-lg font-black text-indigo-800/70 mb-1">🃏 Pick the card</p>
      <motion.span key={current} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'tween', duration: 0.3 }}
        className="text-6xl sm:text-7xl block mb-3">{data.emoji}</motion.span>
      <div className="flex gap-3 justify-center">
        {options.map(l => {
          const d = getLetterData(l);
          const isCorrect = flash === 'correct' && l === current;
          const isWrong = flash === 'wrong';
          return (
            <motion.button key={l} whileTap={{ scale: 0.92 }} onClick={() => handleTap(l)}
              className="w-24 sm:w-28 h-28 sm:h-32 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg"
              style={{
                background: isCorrect ? 'linear-gradient(135deg, #22C55E, #16A34A)' : isWrong ? 'linear-gradient(135deg, #EF4444, #DC2626)' : `linear-gradient(135deg, ${d.color}dd, ${d.color}88)`,
                border: '3px solid rgba(255,255,255,0.25)',
                boxShadow: isCorrect ? '0 0 30px rgba(34,197,94,0.5)' : isWrong ? '0 0 30px rgba(239,68,68,0.5)' : '0 8px 24px rgba(0,0,0,0.3)',
              }}
            >
              <span className="text-2xl sm:text-3xl">{d.emoji}</span>
              <span className="text-xs sm:text-sm font-black text-white/80">{l}</span>
            </motion.button>
          );
        })}
      </div>
      {flash === 'wrong' && <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold text-yellow-700 mt-3">Not that one! 💪</motion.p>}
      <div className="flex justify-center gap-1.5 mt-3">
        {queue.map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < idx ? 'bg-green-400' : i === idx ? 'bg-white' : 'bg-white/30'}`} />)}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function LetterCheckpoint({ lessonTitle, onComplete, onClose }: Props) {
  const qc = useQueryClient();

  const handleDone = useCallback(() => {
    qc.invalidateQueries({ queryKey: studentKeys.lessons });
    qc.invalidateQueries({ queryKey: studentKeys.dashboard });
    onComplete();
  }, [qc, onComplete]);

  const lower = lessonTitle.toLowerCase();
  let game: 'find' | 'balloon' | 'pick' = 'find';
  if (lower.includes('balloon')) game = 'balloon';
  else if (lower.includes('card')) game = 'pick';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500">
      <div className="relative w-full max-w-md sm:max-w-xl mx-2 my-2 rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/30"
        style={{ background: 'linear-gradient(145deg, #7dd3fc, #38bdf8, #3b82f6)' }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-white/20 to-transparent skew-x-[-20deg] translate-x-32 pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-white/15 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-xs font-bold text-indigo-700/50">
              {game === 'find' ? '🔍' : game === 'balloon' ? '🎈' : '🃏'} {lessonTitle}
            </span>
            <button onClick={onClose} className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-indigo-600 text-sm font-bold">&times;</button>
          </div>

          {game === 'find' && <FindLetter onDone={handleDone} />}
          {game === 'balloon' && <PopBalloon onDone={handleDone} />}
          {game === 'pick' && <PickCard onDone={handleDone} />}
        </div>

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '20px 20px' }} />
      </div>
    </div>
  );
}
