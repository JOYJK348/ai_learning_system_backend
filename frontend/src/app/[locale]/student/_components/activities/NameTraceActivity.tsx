'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { audioEngine } from '@/core/utils/audio';

type Props = {
  config: { prompt?: string; color?: string; name?: string };
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
  studentName?: string;
};

const PASS_THRESHOLD = 55;
const TRACE_TOLERANCE = 24;
const MIN_TRACE_RATIO = 0.5;

const LETTER_SEGMENTS: Record<string, [number, number, number, number][]> = {
  'A': [[0.2,0.9,0.5,0.1],[0.8,0.9,0.5,0.1],[0.35,0.6,0.65,0.6]],
  'B': [[0.25,0.1,0.25,0.9],[0.25,0.1,0.65,0.1],[0.65,0.1,0.72,0.28],[0.72,0.28,0.65,0.48],[0.65,0.48,0.25,0.5],[0.25,0.5,0.65,0.52],[0.65,0.52,0.72,0.72],[0.72,0.72,0.65,0.9],[0.65,0.9,0.25,0.9]],
  'C': [[0.75,0.15,0.45,0.07],[0.45,0.07,0.2,0.28],[0.2,0.28,0.2,0.72],[0.2,0.72,0.45,0.93],[0.45,0.93,0.75,0.85]],
  'D': [[0.25,0.1,0.25,0.9],[0.25,0.1,0.55,0.1],[0.55,0.1,0.75,0.28],[0.75,0.28,0.8,0.5],[0.8,0.5,0.75,0.72],[0.75,0.72,0.55,0.9],[0.55,0.9,0.25,0.9]],
  'E': [[0.75,0.1,0.2,0.1],[0.2,0.1,0.2,0.9],[0.2,0.9,0.75,0.9],[0.2,0.5,0.65,0.5]],
  'F': [[0.75,0.1,0.2,0.1],[0.2,0.1,0.2,0.9],[0.2,0.5,0.65,0.5]],
  'G': [[0.75,0.15,0.45,0.07],[0.45,0.07,0.2,0.28],[0.2,0.28,0.2,0.72],[0.2,0.72,0.45,0.93],[0.45,0.93,0.75,0.85],[0.75,0.85,0.75,0.5],[0.75,0.5,0.55,0.5]],
  'H': [[0.2,0.1,0.2,0.9],[0.8,0.1,0.8,0.9],[0.2,0.5,0.8,0.5]],
  'I': [[0.5,0.1,0.5,0.9]],
  'J': [[0.65,0.1,0.65,0.72],[0.65,0.72,0.5,0.9],[0.5,0.9,0.3,0.85]],
  'K': [[0.25,0.1,0.25,0.9],[0.25,0.45,0.75,0.12],[0.25,0.55,0.78,0.88]],
  'L': [[0.2,0.1,0.2,0.9],[0.2,0.9,0.8,0.9]],
  'M': [[0.15,0.9,0.15,0.1],[0.15,0.1,0.5,0.5],[0.5,0.5,0.85,0.1],[0.85,0.1,0.85,0.9]],
  'N': [[0.2,0.9,0.2,0.1],[0.2,0.1,0.8,0.9],[0.8,0.9,0.8,0.1]],
  'O': [[0.25,0.1,0.75,0.1],[0.75,0.1,0.85,0.3],[0.85,0.3,0.85,0.7],[0.85,0.7,0.75,0.9],[0.75,0.9,0.25,0.9],[0.25,0.9,0.15,0.7],[0.15,0.7,0.15,0.3],[0.15,0.3,0.25,0.1]],
  'P': [[0.3,0.1,0.3,0.9],[0.3,0.1,0.68,0.1],[0.68,0.1,0.78,0.25],[0.78,0.25,0.68,0.45],[0.68,0.45,0.3,0.5]],
  'Q': [[0.25,0.1,0.75,0.1],[0.75,0.1,0.85,0.3],[0.85,0.3,0.85,0.7],[0.85,0.7,0.75,0.9],[0.75,0.9,0.25,0.9],[0.25,0.9,0.15,0.7],[0.15,0.7,0.15,0.3],[0.15,0.3,0.25,0.1],[0.6,0.65,0.85,0.95]],
  'R': [[0.25,0.1,0.25,0.9],[0.25,0.1,0.68,0.1],[0.68,0.1,0.78,0.25],[0.78,0.25,0.68,0.45],[0.68,0.45,0.25,0.5],[0.45,0.5,0.78,0.9]],
  'S': [[0.78,0.12,0.5,0.07],[0.5,0.07,0.22,0.2],[0.22,0.2,0.28,0.4],[0.28,0.4,0.72,0.5],[0.72,0.5,0.78,0.7],[0.78,0.7,0.62,0.93],[0.62,0.93,0.25,0.85]],
  'T': [[0.15,0.1,0.85,0.1],[0.5,0.1,0.5,0.9]],
  'U': [[0.2,0.1,0.2,0.6],[0.2,0.6,0.3,0.82],[0.3,0.82,0.7,0.82],[0.7,0.82,0.8,0.6],[0.8,0.6,0.8,0.1]],
  'V': [[0.12,0.1,0.5,0.85],[0.5,0.85,0.88,0.1]],
  'W': [[0.08,0.1,0.22,0.85],[0.22,0.85,0.5,0.28],[0.5,0.28,0.78,0.85],[0.78,0.85,0.92,0.1]],
  'X': [[0.12,0.1,0.88,0.9],[0.88,0.1,0.12,0.9]],
  'Y': [[0.12,0.1,0.5,0.5],[0.88,0.1,0.5,0.5],[0.5,0.5,0.5,0.9]],
  'Z': [[0.1,0.1,0.9,0.1],[0.9,0.1,0.1,0.9],[0.1,0.9,0.9,0.9]],
};

const LETTER_EMOJIS: Record<string, string> = {
  'A': '🍎','B': '🏀','C': '🐱','D': '🐕','E': '🐘','F': '🐟','G': '🍇','H': '🎩',
  'I': '🍦','J': '🏺','K': '🪁','L': '🦁','M': '🥭','N': '🪹','O': '🦉','P': '🐧',
  'Q': '👑','R': '🐰','S': '☀️','T': '🐯','U': '☂️','V': '🚐','W': '⌚','X': '🎹',
  'Y': '🦬','Z': '🦓',
};

function generateDottedPath(segments: [number, number, number, number][], w: number, h: number) {
  const pts: { x: number; y: number }[] = [];
  if (!segments?.length) {
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      pts.push({ x: 20 + t * (w - 40), y: h / 2 });
    }
    return pts;
  }
  const padX = w * 0.08, padY = h * 0.05;
  const padW = w - padX * 2, padH = h - padY * 2;
  const ptsPerSeg = Math.max(8, Math.floor(50 / segments.length));
  for (const [x1, y1, x2, y2] of segments) {
    for (let i = 0; i <= ptsPerSeg; i++) {
      const t = i / ptsPerSeg;
      pts.push({
        x: padX + (x1 + t * (x2 - x1)) * padW,
        y: padY + (y1 + t * (y2 - y1)) * padH,
      });
    }
  }
  return pts;
}

export default function NameTraceActivity({ config, onComplete, studentName }: Props) {
  const name = ((config.name || studentName || 'Explorer').toUpperCase()).slice(0, 10);
  const letters = name.split('');

  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedLetters, setCompletedLetters] = useState<Set<number>>(new Set());
  const [letterScores, setLetterScores] = useState<number[]>(new Array(letters.length).fill(0));
  const [allDone, setAllDone] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const startTime = useRef(Date.now());

  const currentLetter = letters[currentIdx] || 'A';
  const hasSegments = !!LETTER_SEGMENTS[currentLetter];
  const segments = LETTER_SEGMENTS[currentLetter] || [];

  return (
    <div className="flex flex-col items-center w-full min-h-[400px] sm:min-h-[500px] px-3 sm:px-6 py-4 select-none">
      <div className="relative w-full max-w-lg rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-2 border-amber-200/60">
        <div className="absolute inset-0 bg-[#FFF8E7]" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 35px, #E8D5B7 35px, #E8D5B7 36px),
            repeating-linear-gradient(0deg, transparent, transparent 70px, #FFD7D7 70px, #FFD7D7 71px)
          `,
          backgroundSize: '100% 71px',
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100%25\' height=\'100%25\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
        }} />
        <div className="relative z-10 p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm sm:text-base font-black text-amber-900 uppercase tracking-tight">
              ✏️ My Name Notebook
            </h2>
            <span className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest">
              {name}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-6 pb-4 border-b-2 border-amber-200/40">
            {letters.map((letter, idx) => {
              const isDone = completedLetters.has(idx);
              const isCurrent = idx === currentIdx;
              return (
                <motion.div
                  key={idx}
                  layout
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base font-black transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-400 text-white shadow-md scale-100'
                      : isCurrent
                      ? 'bg-amber-400 text-white shadow-lg scale-110 ring-2 ring-amber-300'
                      : 'bg-amber-100/60 text-amber-400'
                  }`}
                >
                  {isDone ? <CheckCircle size={18} className="text-white" /> : letter}
                </motion.div>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-4"
            >
              <LetterTraceCanvas
                letter={currentLetter}
                hasSegments={hasSegments}
                segments={segments}
                isDone={completedLetters.has(currentIdx)}
                onComplete={(score) => {
                  const newCompleted = new Set(completedLetters);
                  newCompleted.add(currentIdx);
                  setCompletedLetters(newCompleted);
                  const newScores = [...letterScores];
                  newScores[currentIdx] = score;
                  setLetterScores(newScores);
                  audioEngine?.speak(`Great ${currentLetter}!`);
                  if (currentIdx < letters.length - 1) {
                    setTimeout(() => setCurrentIdx(currentIdx + 1), 800);
                  } else {
                    setTimeout(() => {
                      setAllDone(true);
                      setShowCelebration(true);
                      audioEngine?.speak(`You wrote ${name}! Amazing!`);
                    }, 600);
                  }
                }}
              />
              <div className="flex items-center gap-2 mt-1">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xl"
                >
                  {LETTER_EMOJIS[currentLetter] || '⭐'}
                </motion.div>
                <span className="text-[11px] font-bold text-amber-700/60 uppercase tracking-wider">
                  Trace the letter <span className="text-amber-900 font-black">{currentLetter}</span> — {completedLetters.size + 1} of {letters.length}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={() => { if (currentIdx > 0) setCurrentIdx(currentIdx - 1); }}
          disabled={currentIdx === 0}
          className={`p-3 rounded-2xl transition-all ${
            currentIdx === 0
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-white text-amber-700 shadow-md hover:shadow-lg hover:bg-amber-50'
          }`}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => { if (currentIdx < letters.length - 1) setCurrentIdx(currentIdx + 1); }}
          disabled={currentIdx >= letters.length - 1}
          className={`p-3 rounded-2xl transition-all ${
            currentIdx >= letters.length - 1
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-white text-amber-700 shadow-md hover:shadow-lg hover:bg-amber-50'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="mt-4">
        {allDone ? (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const avgScore = letterScores.reduce((a, b) => a + b, 0) / letters.length;
              onComplete({
                score: Math.round(avgScore),
                max_score: 100,
                completion_data: { name, letters_traced: letters.length, letter_scores: letterScores },
                time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000),
              });
            }}
            className="px-10 py-4 bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all"
          >
            🎉 All Done! Continue →
          </motion.button>
        ) : (
          <button
            onClick={() => {
              setCurrentIdx(0);
              setCompletedLetters(new Set());
              setLetterScores(new Array(letters.length).fill(0));
              setAllDone(false);
              setShowCelebration(false);
              startTime.current = Date.now();
            }}
            className="px-6 py-3 bg-amber-100 text-amber-600 font-black text-sm rounded-2xl hover:bg-amber-200 transition-all shadow-sm"
          >
            <RotateCcw size={16} className="inline mr-1" /> Restart
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-2xl text-center max-w-sm mx-4 border-4 border-amber-200"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-7xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-900 mb-2">
                You Wrote {name}!
              </h2>
              <p className="text-sm font-bold text-amber-700/60 mb-6">
                Every single letter! You're a writing star! ⭐
              </p>
              <button
                onClick={() => {
                  setShowCelebration(false);
                  const avgScore = letterScores.reduce((a, b) => a + b, 0) / letters.length;
                  onComplete({
                    score: Math.round(avgScore),
                    max_score: 100,
                    completion_data: { name, letters_traced: letters.length, letter_scores: letterScores },
                    time_taken_seconds: Math.round((Date.now() - startTime.current) / 1000),
                  });
                }}
                className="px-8 py-3 bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                Continue →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────── LETTER TRACE CANVAS ─────────── */
function LetterTraceCanvas({
  letter,
  hasSegments,
  segments,
  isDone,
  onComplete,
}: {
  letter: string;
  hasSegments: boolean;
  segments: [number, number, number, number][];
  isDone: boolean;
  onComplete: (score: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);
  const [dimensions, setDimensions] = useState({ w: 400, h: 200 });
  const [dottedPath, setDottedPath] = useState<{ x: number; y: number }[]>([]);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = Math.max(Math.round(w * 0.45), 160);
        setDimensions({ w, h });
        setDottedPath(generateDottedPath(segments, w, h));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [letter, segments]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;
  }, [dimensions]);

  useEffect(() => {
    if (!done && showHint) {
      const timer = setTimeout(() => setShowHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [done, showHint, letter]);

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
    if (done || isDone) return;
    e.preventDefault();
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    setPoints(prev => [...prev, pos]);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [done, isDone, getCanvasPos]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || done || isDone) return;
    e.preventDefault();
    const pos = getCanvasPos(e);
    setPoints(prev => [...prev, pos]);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [isDrawing, done, isDone, getCanvasPos]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
  }, [isDrawing]);

  const validateDrawing = useCallback(() => {
    if (done || isDone || points.length < 20) return;

    const sampled = points.filter((_, i) => i % 3 === 0);
    if (sampled.length < 5) return;

    const minTraceNeeded = Math.max(10, Math.floor(dottedPath.length * MIN_TRACE_RATIO));
    if (sampled.length < minTraceNeeded) {
      setPassed(false);
      setDone(true);
      return;
    }

    let correct = 0;
    for (const pt of sampled) {
      for (const d of dottedPath) {
        const dx = d.x - pt.x, dy = d.y - pt.y;
        if (Math.sqrt(dx * dx + dy * dy) < TRACE_TOLERANCE) {
          correct++;
          break;
        }
      }
    }
    const accuracy = Math.round((correct / sampled.length) * 100);
    const isPass = accuracy >= PASS_THRESHOLD;

    setPassed(isPass);
    setDone(true);

    if (isPass) {
      setTimeout(() => onComplete(accuracy), 700);
    }
  }, [done, isDone, points, dottedPath, onComplete]);

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setPoints([]);
    setHasDrawn(false);
    setDone(false);
    setPassed(false);
    setIsDrawing(false);
    setShowHint(true);
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden touch-none bg-white/60 border-2 border-amber-200/50 shadow-inner"
        style={{ height: dimensions.h }}
      >
        <svg
          width={dimensions.w}
          height={dimensions.h}
          className="absolute inset-0 z-0 pointer-events-none opacity-40"
        >
          <line x1="0" y1={dimensions.h * 0.65} x2={dimensions.w} y2={dimensions.h * 0.65}
            stroke="#E8D5B7" strokeWidth="2" strokeDasharray="8 4" />
          <line x1="0" y1={dimensions.h * 0.8} x2={dimensions.w} y2={dimensions.h * 0.8}
            stroke="#FFD7D7" strokeWidth="2" strokeDasharray="8 4" />
          <line x1="0" y1={dimensions.h * 0.35} x2={dimensions.w} y2={dimensions.h * 0.35}
            stroke="#E8D5B7" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
        </svg>

        <svg
          width={dimensions.w}
          height={dimensions.h}
          className="absolute inset-0 z-[1] pointer-events-none"
        >
          {hasSegments ? (
            dottedPath.map((p, i) => (
              <circle
                key={i}
                cx={p.x} cy={p.y} r={4}
                fill={i === 0 ? '#22C55E' : '#A78BFA'}
                opacity={i === 0 ? 1 : 0.4}
              />
            ))
          ) : (
            <text
              x={dimensions.w / 2} y={dimensions.h / 2}
              textAnchor="middle" dominantBaseline="central"
              className="fill-amber-400/60" fontSize="72" fontWeight="900" opacity="0.25"
            >
              {letter}
            </text>
          )}
          {hasSegments && dottedPath.length > 0 && (
            <>
              <text x={dottedPath[0].x} y={dottedPath[0].y - 16}
                fontSize="8" fill="#22C55E" fontWeight="900" textAnchor="middle">
                START
              </text>
              <circle cx={dottedPath[0].x} cy={dottedPath[0].y} r={10}
                fill="none" stroke="#22C55E" strokeWidth="2" opacity="0.5">
                <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </svg>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-[2] cursor-crosshair w-full h-full touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />

        {showHint && !done && !isDone && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-indigo-600/80 text-white px-5 py-2 rounded-full text-[11px] font-black shadow-lg backdrop-blur-sm"
            >
              👆 Trace {letter}!
            </motion.div>
          </div>
        )}

        {done && (
          <div className="absolute inset-0 z-[4] flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
            {passed ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                  className="text-5xl"
                >
                  ⭐
                </motion.div>
                <p className="text-sm font-black text-emerald-600 mt-1">Perfect!</p>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-black text-amber-700">Nearly! Try again!</p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="px-5 py-2 bg-amber-500 text-white text-[11px] font-black rounded-full shadow-lg hover:bg-amber-600 transition-all"
                >
                  <RotateCcw size={14} className="inline mr-1" /> Redo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 mt-3">
        {!done && !isDone ? (
          <>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-amber-100 text-amber-600 text-[12px] font-black rounded-xl hover:bg-amber-200 transition-all shadow-sm"
            >
              <RotateCcw size={14} className="inline mr-1" /> Clear
            </button>
            <button
              onClick={validateDrawing}
              disabled={!hasDrawn || points.length < 15}
              className={`px-6 py-2.5 text-[12px] font-black rounded-xl shadow-md transition-all ${
                hasDrawn && points.length >= 15
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Done ✅
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
