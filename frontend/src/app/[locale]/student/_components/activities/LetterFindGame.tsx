'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLetterData, shuffle } from '@/core/data/letterData';

type Props = {
  config: { mode?: string; letters?: string[] };
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
};

const ALL_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

export default function LetterFindGame({ config, onComplete }: Props) {
  const lessonLetters = (config.letters || ['A', 'B', 'C']).slice(0, 6);
  const [queue] = useState(() => shuffle(lessonLetters));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showWrong, setShowWrong] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [done, setDone] = useState(false);
  const startTime = useRef(Date.now());

  const currentLetter = queue[currentIdx];
  const currentData = useMemo(() => getLetterData(currentLetter), [currentLetter]);

  // Build 3 options: correct + 2 random wrong letters
  // Pull from ALL_LETTERS to ensure enough distractors
  const options = useMemo(() => {
    const pool = ALL_LETTERS.filter(l => l !== currentLetter);
    const wrong = shuffle(pool).slice(0, 2);
    return shuffle([currentLetter, ...wrong]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLetter]);

  const handleTap = (letter: string) => {
    if (showCorrect || done) return;
    if (letter === currentLetter) {
      setShowCorrect(true);
      setScore(s => s + 1);
      setTimeout(() => {
        setShowCorrect(false);
        if (currentIdx < queue.length - 1) {
          setCurrentIdx(i => i + 1);
        } else {
          setDone(true);
        }
      }, 1000);
    } else {
      setShowWrong(true);
      setTimeout(() => setShowWrong(false), 600);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 px-6 py-10">
        <motion.span
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-7xl"
        >🎉</motion.span>
        <h2 className="text-3xl font-black text-white drop-shadow-lg text-center">Letter Star!</h2>
        <p className="text-lg font-bold text-white/70 text-center">
          Found {score}/{queue.length} letters!
        </p>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => onComplete({
            score: Math.round((score / queue.length) * 100), max_score: 100,
            completion_data: { found: score, total: queue.length },
            time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000),
          })}
          className="px-10 py-4 bg-white/25 backdrop-blur-md text-white font-black text-lg rounded-full border-2 border-white/40"
        >
          Next ➡️
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 px-4 py-6">
      <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-lg text-center">
        ✨ Find <span className="text-yellow-200">{currentData.word}</span>!
      </h3>

      {/* Big hint: letter + emoji */}
      <motion.div
        key={currentLetter}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] flex flex-col items-center justify-center gap-1 shadow-2xl border-4 border-white/60"
        style={{ background: currentData.color }}
      >
        <span className="text-4xl">{currentData.emoji}</span>
        <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg leading-none">{currentLetter}</span>
      </motion.div>

      <p className="text-sm font-bold text-white/70 text-center -mt-2">
        {currentLetter} is for <span className="text-yellow-200">{currentData.word}</span>!<br />
        Tap the right picture!
      </p>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {queue.map((l, i) => (
          <div key={l + i}
            className={`w-2.5 h-2.5 rounded-full ${i < currentIdx ? 'bg-green-400' : i === currentIdx ? 'bg-white' : 'bg-white/30'}`}
          />
        ))}
      </div>

      {/* 3 option cards — show emoji based on letter */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLetter}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-3 gap-3 sm:gap-4 max-w-sm w-full"
        >
          {options.map((letter) => {
            const data = getLetterData(letter);
            return (
              <motion.button
                key={letter}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleTap(letter)}
                disabled={showCorrect}
                className="flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl bg-white/25 backdrop-blur-md border-2 border-white/40 hover:bg-white/35 transition-all shadow-lg"
              >
                <span className="text-5xl sm:text-6xl">{data.emoji}</span>
                <span className="text-[10px] font-black text-white/80 uppercase">{letter}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Feedback */}
      <AnimatePresence>
        {showCorrect && (
          <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            className="text-lg font-black text-green-300"
          >⭐ Correct! {currentLetter} for {currentData.word}!</motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWrong && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-sm font-black text-yellow-200"
          >🙅 Try again!</motion.p>
        )}
      </AnimatePresence>

      {/* Shake via key change */}
      <div key={String(showWrong)} className={showWrong ? 'animate-[shake_0.4s_ease-in-out]' : ''} />

      <p className="text-[10px] font-bold text-white/50 text-center">
        👆 Tap the one that goes with {currentLetter}!
      </p>
    </div>
  );
}
