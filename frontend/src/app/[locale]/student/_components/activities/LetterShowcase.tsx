'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { studentKeys } from '@/core/services/studentApi';
import { getLetterData, shuffle, LETTER_DATA } from '@/core/data/letterData';

type Props = {
  config: { letter?: string; word?: string; emoji?: string; color?: string };
  onComplete: (data: {
    score: number;
    max_score: number;
    completion_data: Record<string, unknown>;
    time_taken_seconds: number;
  }) => void;
  lessonId?: string;
  nextLessonId?: string;
};

/* ─── Letter SVG paths + stroke-by-stroke instructions (viewBox 0 0 100 120) ─── */
// Each letter has: path (SVG), steps (array of instructions that appear during draw)
interface LetterData {
  path: string;
  steps: string[];
  totalSteps: number;
}

const LETTER_DRAW_CAPS: Record<string, LetterData> = {
  A: { path: 'M 50 10 L 15 105 M 50 10 L 85 105 M 30 70 L 70 70', steps: ['slant down left', 'slant down right', 'cross in the middle'], totalSteps: 3 },
  B: { path: 'M 25 10 L 25 110 M 25 10 C 70 10 75 42 50 60 C 75 78 70 110 25 110', steps: ['straight line down', 'bump out and in', 'bump again at bottom'], totalSteps: 3 },
  C: { path: 'M 80 25 C 65 10 35 12 22 35 C 10 60 15 90 28 105 C 45 120 75 110 80 95', steps: ['start at top right', 'curve left and down', 'curve back to bottom'], totalSteps: 3 },
  D: { path: 'M 25 10 L 25 110 M 25 10 C 75 10 90 60 75 90 C 65 105 40 110 25 105', steps: ['straight line down', 'big curve out', 'curve back in'], totalSteps: 3 },
  E: { path: 'M 80 10 L 25 10 L 25 110 L 80 110 M 25 60 L 70 60', steps: ['line across top', 'line down', 'line across bottom', 'line across middle'], totalSteps: 4 },
  F: { path: 'M 80 10 L 25 10 L 25 110 M 25 60 L 65 60', steps: ['line across top', 'line down', 'line across middle'], totalSteps: 3 },
  G: { path: 'M 75 15 C 55 8 25 15 20 40 C 12 70 25 105 55 105 C 75 105 85 90 85 75 L 85 60 L 55 60', steps: ['curve around top', 'curve down left', 'line goes right'], totalSteps: 3 },
  H: { path: 'M 25 10 L 25 110 M 75 10 L 75 110 M 25 60 L 75 60', steps: ['left line down', 'right line down', 'connect in the middle'], totalSteps: 3 },
  I: { path: 'M 50 10 L 50 110', steps: ['one straight line down'], totalSteps: 1 },
  J: { path: 'M 75 30 C 75 10 35 8 28 22 C 20 38 22 65 30 75 M 50 110 L 50 95', steps: ['curve down left', 'hook at the bottom'], totalSteps: 2 },
  K: { path: 'M 25 10 L 25 110 M 25 55 L 75 15 M 25 55 L 75 105', steps: ['straight line down', 'slant up to top', 'slant down to bottom'], totalSteps: 3 },
  L: { path: 'M 25 10 L 25 110 L 80 110', steps: ['line down', 'line across bottom'], totalSteps: 2 },
  M: { path: 'M 15 110 L 15 20 L 50 55 L 85 20 L 85 110', steps: ['line up left', 'slant down middle', 'slant up middle', 'line down right'], totalSteps: 4 },
  N: { path: 'M 20 110 L 20 15 L 80 110 L 80 15', steps: ['line up left', 'slant down right', 'line up right'], totalSteps: 3 },
  O: { path: 'M 50 10 C 20 10 15 60 50 110 C 85 60 80 10 50 10', steps: ['curve around top', 'curve back around bottom'], totalSteps: 2 },
  P: { path: 'M 25 110 L 25 15 M 25 15 C 75 15 80 55 50 60 C 30 62 25 60 25 60', steps: ['line down from top', 'bump out and back'], totalSteps: 2 },
  Q: { path: 'M 50 10 C 20 10 15 60 50 105 C 75 95 82 50 50 10 M 65 80 L 82 98', steps: ['big round circle', 'little tail at bottom'], totalSteps: 2 },
  R: { path: 'M 25 110 L 25 15 M 25 15 C 75 15 80 55 50 60 C 30 62 25 60 25 60 M 50 60 L 80 110', steps: ['line down', 'bump out and in', 'slant down to bottom'], totalSteps: 3 },
  S: { path: 'M 65 25 C 65 12 25 12 28 35 C 30 55 70 55 72 75 C 75 95 30 100 30 85', steps: ['curve top left', 'curve bottom right'], totalSteps: 2 },
  T: { path: 'M 20 15 L 80 15 M 50 15 L 50 110', steps: ['line across top', 'line down middle'], totalSteps: 2 },
  U: { path: 'M 20 25 C 20 80 80 80 80 25', steps: ['curve down and up'], totalSteps: 1 },
  V: { path: 'M 15 15 L 50 110 L 85 15', steps: ['slant down left', 'slant up right'], totalSteps: 2 },
  W: { path: 'M 10 15 L 30 110 L 50 30 L 70 110 L 90 15', steps: ['slant down', 'slant up', 'slant down', 'slant up'], totalSteps: 4 },
  X: { path: 'M 15 15 L 85 110 M 85 15 L 15 110', steps: ['slant down right', 'cross slant down left'], totalSteps: 2 },
  Y: { path: 'M 15 15 L 50 55 M 85 15 L 50 55 M 50 55 L 50 110', steps: ['slant down left', 'slant down right', 'line straight down'], totalSteps: 3 },
  Z: { path: 'M 15 15 L 85 15 L 15 110 L 85 110', steps: ['line across top', 'slant down left', 'line across bottom'], totalSteps: 3 },
};

const LETTER_DRAW_SMALL: Record<string, LetterData> = {
  a: { path: 'M 55 80 C 35 80 25 65 30 50 C 35 38 50 38 55 50 L 60 80 C 62 90 75 92 78 85 C 80 78 70 72 55 72 L 35 72', steps: ['round circle', 'line down right'], totalSteps: 2 },
  b: { path: 'M 35 115 L 35 25 M 35 40 C 25 40 20 60 28 72 C 35 82 55 82 62 72 C 70 62 65 40 35 40', steps: ['line down', 'bump on right'], totalSteps: 2 },
  c: { path: 'M 70 45 C 60 35 40 35 35 50 C 30 65 35 85 50 92 C 62 96 72 90 75 82', steps: ['curve top left', 'curve bottom right'], totalSteps: 2 },
  d: { path: 'M 65 115 L 65 25 M 65 40 C 75 40 80 60 72 72 C 65 82 45 82 38 72 C 30 62 35 40 65 40', steps: ['line down', 'bump on left'], totalSteps: 2 },
  e: { path: 'M 72 58 C 70 40 30 40 30 55 C 30 70 40 85 55 88 C 68 90 78 80 78 72 L 40 72', steps: ['round body', 'line across middle'], totalSteps: 2 },
  f: { path: 'M 55 25 L 55 102 M 55 25 C 55 18 40 18 40 28 M 35 58 L 72 58', steps: ['line down', 'hook top left', 'line across middle'], totalSteps: 3 },
  g: { path: 'M 55 72 C 35 72 28 55 35 42 C 42 30 62 30 68 42 C 75 55 68 72 55 72 M 55 72 L 55 115 C 55 125 30 125 28 115', steps: ['round circle', 'tail down left'], totalSteps: 2 },
  h: { path: 'M 35 115 L 35 25 M 35 40 C 25 40 22 62 30 72 C 38 82 60 80 65 70 C 70 60 65 40 35 40', steps: ['line down', 'bump across right'], totalSteps: 2 },
  i: { path: 'M 50 40 L 50 102 M 50 25 L 50 30', steps: ['line down', 'dot on top'], totalSteps: 2 },
  j: { path: 'M 55 40 L 55 102 M 55 102 C 55 115 35 115 33 105 M 55 25 L 55 30', steps: ['line down', 'curve bottom left', 'dot on top'], totalSteps: 3 },
  k: { path: 'M 38 115 L 38 25 M 38 65 L 68 45 M 38 65 L 70 88', steps: ['line down', 'slant up right', 'slant down right'], totalSteps: 3 },
  l: { path: 'M 48 115 L 48 25', steps: ['line down'], totalSteps: 1 },
  m: { path: 'M 20 100 L 20 45 M 20 50 C 20 38 40 38 45 52 C 50 38 70 38 75 52 L 78 100', steps: ['left line', 'first hump', 'second hump', 'right line'], totalSteps: 4 },
  n: { path: 'M 28 100 L 28 45 M 28 50 C 28 38 58 38 65 55 L 68 100', steps: ['line down', 'bump across right', 'line down'], totalSteps: 3 },
  o: { path: 'M 50 42 C 30 42 28 68 50 92 C 72 68 70 42 50 42', steps: ['curve around', 'curve back around'], totalSteps: 2 },
  p: { path: 'M 38 102 L 38 42 M 38 48 C 28 48 25 68 32 78 C 40 88 58 88 65 78 C 72 68 65 48 38 48', steps: ['line up from bottom', 'bump on right'], totalSteps: 2 },
  q: { path: 'M 62 102 L 62 42 M 62 48 C 72 48 75 68 68 78 C 60 88 42 88 35 78 C 28 68 35 48 62 48 M 62 102 L 62 118', steps: ['line up from bottom', 'bump on left', 'tail down'], totalSteps: 3 },
  r: { path: 'M 28 100 L 28 45 M 28 48 C 28 40 55 40 60 52 L 52 62', steps: ['line down', 'curve up and hook'], totalSteps: 2 },
  s: { path: 'M 62 42 C 75 42 78 52 68 60 C 55 68 38 65 35 78 C 32 90 50 95 65 90', steps: ['curve top left', 'curve bottom right'], totalSteps: 2 },
  t: { path: 'M 50 25 L 50 105 M 32 58 L 72 58', steps: ['line down', 'line across middle'], totalSteps: 2 },
  u: { path: 'M 28 50 L 28 80 C 28 98 72 98 72 80 L 72 50', steps: ['line down left', 'curve bottom', 'line up right'], totalSteps: 3 },
  v: { path: 'M 22 38 L 50 98 L 78 38', steps: ['slant down left', 'slant up right'], totalSteps: 2 },
  w: { path: 'M 15 38 L 32 98 L 50 48 L 68 98 L 85 38', steps: ['slant down', 'slant up', 'slant down', 'slant up'], totalSteps: 4 },
  x: { path: 'M 25 38 L 75 98 M 75 38 L 25 98', steps: ['slant down right', 'cross slant down left'], totalSteps: 2 },
  y: { path: 'M 22 38 L 50 88 M 78 38 L 50 88 L 50 118', steps: ['slant down left', 'slant down right', 'line straight down'], totalSteps: 3 },
  z: { path: 'M 25 42 L 75 42 L 25 92 L 75 92', steps: ['line across top', 'slant down left', 'line across bottom'], totalSteps: 3 },
};

/* ─── Fun facts per letter ─── */
const LETTER_FACTS: Record<string, string> = {
  A: "A is the first letter of the alphabet!",
  B: "B makes a bouncing 'buh' sound!",
  C: "C curls like a happy cat!",
  D: "D is for dancing dog!",
  E: "E is the most used letter!",
  F: "F sounds like a funny fish!",
  G: "G is for great grapes!",
  H: "H takes a big breath — hhh!",
  I: "I stands tall and proud!",
  J: "J curves down with a dot!",
  K: "K kicks up and down!",
  L: "L makes an L-shape with your fingers!",
  M: "M has two mountain peaks!",
  N: "N goes down, up, and down again!",
  O: "O is a round circle like a ring!",
  P: "P has a line and a big bump!",
  Q: "Q is like an O with a tiny tail!",
  R: "R is like P with a kicking leg!",
  S: "S curves like a slithering snake!",
  T: "T has a hat on top!",
  U: "U curves down like a cup!",
  V: "V points down like a valley!",
  W: "W has two V shapes together!",
  X: "X is two lines crossing!",
  Y: "Y has arms stretching wide!",
  Z: "Z zigzags across like lightning!",
  a: "a is the first letter of the alphabet!",
  b: "b makes a bouncing 'buh' sound!",
  c: "c curls like a happy cat!",
  d: "d is for dancing dog!",
  e: "e is the most used letter!",
  f: "f sounds like a funny fish!",
  g: "g is for great grapes!",
  h: "h takes a big breath — hhh!",
  i: "i stands tall and proud!",
  j: "j curves down with a dot!",
  k: "k kicks up and down!",
  l: "l makes an L-shape with your fingers!",
  m: "m has two mountain peaks!",
  n: "n goes down, up, and down again!",
  o: "o is a round circle like a ring!",
  p: "p has a line and a big bump!",
  q: "q is like an o with a tiny tail!",
  r: "r is like p with a kicking leg!",
  s: "s curves like a slithering snake!",
  t: "t has a hat on top!",
  u: "u curves down like a cup!",
  v: "v points down like a valley!",
  w: "w has two v shapes together!",
  x: "x is two lines crossing!",
  y: "y has arms stretching wide!",
  z: "z zigzags across like lightning!",
};

export default function LetterShowcase({ config, onComplete, nextLessonId }: Props) {
  const rawLetter = (config.letter as string) || 'A';
  const isCaps = rawLetter === rawLetter.toUpperCase() && rawLetter.length === 1;
  const letter = isCaps ? rawLetter : rawLetter.toLowerCase();
  const letterData = getLetterData(letter.toUpperCase());
  const word = (config.word as string) || letterData.word;
  const emoji = (config.emoji as string) || letterData.emoji;
  const color = (config.color as string) || letterData.color;
  const drawMap = isCaps ? LETTER_DRAW_CAPS : LETTER_DRAW_SMALL;
  const lookupKey = isCaps ? letter : letter.toLowerCase();
  const drawData = drawMap[lookupKey] || { path: 'M 50 10 L 50 110', steps: ['line down'], totalSteps: 1 };
  const pathD = drawData.path;
  const steps = drawData.steps;
  const totalSteps = drawData.totalSteps;
  const fact = LETTER_FACTS[letter] || 'fun letter!';
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<'showcase' | 'quiz' | 'done'>('showcase');
  const [showExtra, setShowExtra] = useState(false);
  const [wrongTap, setWrongTap] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const startTime = useRef(Date.now());

  /* ── Prefetch next lesson when showcase is visible ── */
  useEffect(() => {
    if (phase === 'showcase' && nextLessonId) {
      queryClient.prefetchQuery({
        queryKey: studentKeys.activities(nextLessonId),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [phase, nextLessonId, queryClient]);

  /* ── Step-by-step instruction timing ── */
  useEffect(() => {
    if (phase !== 'showcase') return;
    // Show steps one by one during the draw (each step takes ~1.5s)
    const stepDuration = 1800;
    const stepTimers: NodeJS.Timeout[] = [];
    for (let i = 0; i <= totalSteps; i++) {
      stepTimers.push(setTimeout(() => {
        setCurrentStep(i);
      }, i * stepDuration));
    }
    // Show emoji+word after draw completes
    stepTimers.push(setTimeout(() => setShowExtra(true), totalSteps * stepDuration + 400));
    return () => stepTimers.forEach(clearTimeout);
  }, [phase, totalSteps]);

  /* ── Quiz options ── */
  const quizOptions = useMemo(() => {
    const allEntries = Object.entries(LETTER_DATA) as [string, { word: string; emoji: string }][];
    const distractors = allEntries
      .filter(([k]) => k !== letter.toUpperCase())
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map(([, v]) => ({ word: v.word, emoji: v.emoji }));
    return shuffle([
      { id: 'correct', word, emoji, correct: true },
      ...distractors.map((d, i) => ({ id: `w${i}`, ...d, correct: false })),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter, word, emoji]);

  /* ── Handlers ── */
  const handleQuizTap = useCallback((opt: { id: string; correct: boolean }) => {
    if (selectedId) return;
    setSelectedId(opt.id);
    if (opt.correct) {
      setTimeout(() => setPhase('done'), 800);
    } else {
      setWrongTap(true);
      setTimeout(() => { setWrongTap(false); setSelectedId(null); }, 600);
    }
  }, [selectedId]);

  const handleComplete = useCallback(() => {
    onComplete({
      score: 100, max_score: 100,
      completion_data: { letter, word, emoji, quiz_passed: true },
      time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000),
    });
  }, [onComplete, letter, word, emoji]);

  const bgGrad = `linear-gradient(145deg, ${color}dd, ${color}55)`;

  return (
    <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4 pt-1 sm:pt-2 pb-2 sm:pb-3 select-none">
      <AnimatePresence mode="wait">
        {/* ═══════════ PHASE 1: SHOWCASE ═══════════ */}
        {phase === 'showcase' && (
          <motion.div
            key="showcase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl border border-white/10"
              style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>
              {/* SVG Letter Animation Area */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[3/2]">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '20px 20px' }} />

                {isCaps ? (
                  <svg viewBox="0 0 100 120" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {pathD && (
                      <path d={pathD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    )}
                    {pathD && (
                      <motion.path d={pathD} fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.9}
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: totalSteps * 1.6, ease: 'easeInOut' }}
                        style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
                      />
                    )}
                  </svg>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <motion.span
                      initial={{ opacity: 0, scale: 2 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="font-black text-white select-none"
                      style={{ fontSize: 'clamp(5rem, 20vw, 8rem)', filter: `drop-shadow(0 0 20px ${color}60)` }}
                    >
                      {letter}
                    </motion.span>
                  </div>
                )}

                {/* Step-by-step instruction overlay */}
                {currentStep < totalSteps && (
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full"
                    style={{ background: `${color}33`, backdropFilter: 'blur(8px)', border: `1px solid ${color}44` }}
                  >
                    <span className="text-[10px] sm:text-xs font-bold text-white/80 tracking-wide flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: color }}>
                        {currentStep + 1}
                      </span>
                      {steps[currentStep]}
                    </span>
                  </motion.div>
                )}

                {/* Floating emoji + word - appears after draw */}
                <AnimatePresence>
                  {showExtra && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <motion.span
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 250, damping: 14, delay: 0.1 }}
                        className="text-xl sm:text-2xl"
                      >
                        {emoji}
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs sm:text-sm font-bold text-white/80 tracking-wide"
                      >
                        {letter} = {word}
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Letter label top-left */}
                <div className="absolute top-2 sm:top-3 left-3 sm:left-4 flex items-center gap-1.5">
                  <span className="text-[10px] sm:text-xs font-semibold text-white/30 tracking-widest uppercase">Letter</span>
                  <span className="text-sm sm:text-base font-black text-white/50">{letter}</span>
                </div>
              </div>

              {/* Bottom section: fact + button */}
              <AnimatePresence>
                {showExtra && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 flex flex-col items-center gap-3"
                  >
                    <p className="text-[10px] sm:text-xs text-white/40 font-medium text-center max-w-xs leading-relaxed">
                      {fact}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setPhase('quiz')}
                      className="px-6 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all"
                      style={{ background: color, boxShadow: `0 4px 20px ${color}50`, color: '#fff' }}
                    >
                      Got It! ✨
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-[8px] sm:text-[10px] font-medium text-white/25 text-center mt-2 tracking-wider uppercase">
              Watch the letter draw itself
            </p>
          </motion.div>
        )}

        {/* ═══════════ PHASE 2: QUIZ ═══════════ */}
        {phase === 'quiz' && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-white/10"
              style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>
              <div className="px-4 sm:px-6 pt-5 sm:pt-7 pb-3 sm:pb-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-xl sm:text-2xl">🤔</span>
                  <h3 className="text-base sm:text-lg font-bold text-white/90">
                    What is <span style={{ color }}>{letter}</span> for?
                  </h3>
                </div>
                <p className="text-[10px] sm:text-xs text-white/40 font-medium">Tap the matching picture</p>
              </div>

              <motion.div
                animate={wrongTap ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.3, type: 'tween' }}
                className="px-4 sm:px-6 pb-5 sm:pb-7"
              >
                <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-sm mx-auto">
                  {quizOptions.map((opt) => {
                    const isSelected = selectedId === opt.id;
                    const isWin = isSelected && opt.correct;
                    const isLose = isSelected && !opt.correct;

                    return (
                      <motion.button
                        key={opt.id}
                        whileHover={!selectedId ? { y: -3, scale: 1.03 } : {}}
                        whileTap={!selectedId ? { scale: 0.95 } : {}}
                        onClick={() => handleQuizTap(opt)}
                        className="relative flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-4 rounded-xl transition-all overflow-hidden"
                        style={{
                          background: isWin
                            ? 'rgba(34,197,94,0.2)'
                            : isLose
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(255,255,255,0.06)',
                          border: isWin
                            ? '2px solid rgba(34,197,94,0.5)'
                            : isLose
                            ? '2px solid rgba(239,68,68,0.5)'
                            : '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {isWin && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px] sm:text-[10px] font-bold shadow-lg"
                          >
                            ✓
                          </motion.div>
                        )}
                        <span className="text-3xl sm:text-5xl">{opt.emoji}</span>
                        <span className={`text-[9px] sm:text-[11px] font-bold ${isWin ? 'text-green-400' : isLose ? 'text-red-400' : 'text-white/50'} uppercase tracking-wider`}>
                          {opt.word}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {wrongTap && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-[10px] sm:text-xs font-bold text-red-300 mt-3"
                  >
                    Not that one — try again! 💪
                  </motion.p>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ═══════════ PHASE 3: DONE ═══════════ */}
        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <div className="rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 text-center"
              style={{ background: `linear-gradient(160deg, ${color}22, #0f172a 60%)` }}>
              <div className="px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center gap-2 sm:gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 5, -5, 0] }}
                  transition={{ type: 'tween', duration: 0.5 }}
                  className="text-3xl sm:text-5xl"
                >
                  {emoji}
                </motion.div>

                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-base sm:text-xl font-bold text-white/90"
                >
                  {letter} is for {word}!
                </motion.p>

                <motion.p
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-[9px] sm:text-xs text-white/40 font-medium"
                >
                  You learned the letter {letter}! 🌟
                </motion.p>

                {/* Letter preview for visual satisfaction */}
                {isCaps ? (
                  <motion.svg viewBox="0 0 100 120" className="w-16 sm:w-20 h-auto my-1"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
                    {pathD && (
                      <path d={pathD} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} style={{ filter: `drop-shadow(0 0 8px ${color}40)` }} />
                    )}
                  </motion.svg>
                ) : (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="text-3xl sm:text-4xl font-black my-1" style={{ color }}>
                    {letter}
                  </motion.span>
                )}

                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleComplete}
                  className="mt-1 px-6 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all"
                  style={{ background: color, boxShadow: `0 4px 20px ${color}50`, color: '#fff' }}
                >
                  Continue ➡️
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
