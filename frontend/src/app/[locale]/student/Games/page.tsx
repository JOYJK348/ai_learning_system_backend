'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2, CheckCircle, XCircle, Star, ArrowRight,
  Cloud, Gamepad2, Sparkles, Play
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { audioEngine } from '@/core/utils/audio';


/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */
function speak(text: string) {
  audioEngine?.speak(text);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ═══════════════════════════════════════════
   GAME 1: SOUND MATCH — Listen & Pick! 🔊🎯
   ═══════════════════════════════════════════ */
function SoundMatchGame({ onBack }: { onBack: () => void }) {
  const { subjects } = useData();
  const allLessons = subjects.flatMap(s => s.chapters.flatMap(c => c.lessons.map(l => ({
    id: l.id,
    title: l.title,
    emoji: '📚',
    color: 'bg-sky-100',
    text: 'text-sky-600',
    border: 'border-sky-300',
    status: l.progress?.status || 'not-started',
    quiz: { question: `Find the ${l.title}!`, options: [
      { n: 'A', e: '🌟' }, { n: 'B', e: '🚀' }, { n: 'C', e: '💫' }
    ], correct: 'A' }
  }))));
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const totalRounds = 5;

  const rounds = useRef(
    shuffleArray(allLessons).slice(0, totalRounds).map(lesson => {
      const wrongOptions = shuffleArray(allLessons.filter(l => l.id !== lesson.id)).slice(0, 2);
      return {
        answer: lesson,
        options: shuffleArray([lesson, ...wrongOptions])
      };
    })
  ).current;

  const currentRound = rounds[round];

  useEffect(() => {
    if (!gameOver && currentRound) {
      setTimeout(() => speak(`Find the ${currentRound.answer.title.replace(/^[A-Z] for /, '')}`), 600);
    }
  }, [round, gameOver]);

  const handlePick = (option: any) => {
    if (result) return;
    setSelected(option.id);
    if (option.id === currentRound.answer.id) {
      setResult('correct');
      setScore(s => s + 1);
      speak('Great job!');
      setTimeout(() => {
        if (round + 1 >= totalRounds) { setGameOver(true); }
        else { setRound(r => r + 1); setSelected(null); setResult(null); }
      }, 1500);
    } else {
      setResult('wrong');
      speak('Try again!');
      setTimeout(() => { setSelected(null); setResult(null); }, 1200);
    }
  };

  if (gameOver) return (
    <GameComplete title="Sound Match" score={score} total={totalRounds} onBack={onBack} />
  );

  return (
    <GameShell title="Sound Match" subtitle="Listen and tap the right one!" round={round + 1} total={totalRounds} score={score} onBack={onBack}>
      <button 
        onPointerDown={() => speak(`Find the ${currentRound.answer.title.replace(/^[A-Z] for /, '')}`)} 
        className="mx-auto mb-10 w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(59,130,246,0.4)] hover:scale-110 active:scale-95 transition-transform [touch-action:none]"
      >
        <Volume2 className="text-white" size={40} />
      </button>
      <p className="text-center text-blue-800 font-black text-sm uppercase tracking-[0.3em] mb-8">Tap the speaker, then pick!</p>
      <div className="grid grid-cols-3 gap-6">
        {currentRound.options.map((opt: any) => (
          <motion.button key={opt.id} whileHover={{ scale: 1.08, y: -5 }} whileTap={{ scale: 0.92 }}
            onTap={() => handlePick(opt)}
            className={`aspect-square rounded-[3rem] flex flex-col items-center justify-center border-4 transition-all [touch-action:none]
              ${selected === opt.id && result === 'correct' ? 'bg-emerald-100 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
              : selected === opt.id && result === 'wrong' ? 'bg-red-50 border-red-300 animate-[shake_0.4s_ease-in-out]' 
              : 'bg-white/80 border-white hover:border-blue-300 hover:shadow-xl'}`}
          >
            <span className="text-6xl sm:text-7xl mb-2 select-none">{opt.emoji}</span>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{opt.title.replace(/^[A-Z] for /, '').replace(/^Number /, '')}</span>
          </motion.button>
        ))}
      </div>
    </GameShell>
  );
}

/* ═══════════════════════════════════════════
   GAME 2: TRUE OR FALSE — Silly Style! 🤪✅❌
   ═══════════════════════════════════════════ */
const SILLY_QUESTIONS = [
  { q: 'Is an elephant small?', a: false, emoji: '🐘' },
  { q: 'Do fish live in water?', a: true, emoji: '🐟' },
  { q: 'Is ice cream hot?', a: false, emoji: '🍦' },
  { q: 'Does the sun shine?', a: true, emoji: '☀️' },
  { q: 'Do cats say Moo?', a: false, emoji: '🐱' },
  { q: 'Is the sky blue?', a: true, emoji: '🌤️' },
  { q: 'Can a bird fly?', a: true, emoji: '🐦' },
  { q: 'Do we eat shoes?', a: false, emoji: '👟' },
  { q: 'Is a giraffe short?', a: false, emoji: '🦒' },
  { q: 'Does rain fall from clouds?', a: true, emoji: '🌧️' },
];

function TrueOrFalseGame({ onBack }: { onBack: () => void }) {
  const questions = useRef(shuffleArray(SILLY_QUESTIONS).slice(0, 5)).current;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const current = questions[round];

  useEffect(() => {
    if (!gameOver && current) {
      setTimeout(() => speak(current.q), 500);
    }
  }, [round, gameOver]);

  const handleAnswer = (answer: boolean) => {
    if (result) return;
    if (answer === current.a) {
      setResult('correct');
      setScore(s => s + 1);
      speak(answer ? 'Yes! Correct!' : 'No way! You got it!');
    } else {
      setResult('wrong');
      speak('Oops! That\'s not right!');
    }
    setTimeout(() => {
      if (round + 1 >= questions.length) setGameOver(true);
      else { setRound(r => r + 1); setResult(null); }
    }, 1500);
  };

  if (gameOver) return <GameComplete title="True or False" score={score} total={questions.length} onBack={onBack} />;

  return (
    <GameShell title="True or False" subtitle="Is this silly statement true?" round={round + 1} total={questions.length} score={score} onBack={onBack}>
      <motion.div key={round} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl p-10 rounded-[4rem] border-4 border-white shadow-xl mb-10 text-center"
      >
        <span className="text-8xl block mb-6 select-none">{current.emoji}</span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 leading-snug">{current.q}</h2>
        {result && (
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className={`mt-4 font-black text-lg ${result === 'correct' ? 'text-emerald-600' : 'text-rose-500'}`}
          >{result === 'correct' ? '🎉 Correct!' : '😅 Oops!'}</motion.p>
        )}
      </motion.div>
      <div className="grid grid-cols-2 gap-8">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} onTap={() => handleAnswer(true)}
          className="h-32 rounded-[3rem] bg-emerald-500 text-white font-black text-2xl flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(16,185,129,0.3)] hover:shadow-[0_20px_60px_rgba(16,185,129,0.4)] transition-all [touch-action:none]"
        ><CheckCircle size={36} /> TRUE</motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }} onTap={() => handleAnswer(false)}
          className="h-32 rounded-[3rem] bg-rose-500 text-white font-black text-2xl flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(244,63,94,0.3)] hover:shadow-[0_20px_60px_rgba(244,63,94,0.4)] transition-all [touch-action:none]"
        ><XCircle size={36} /> FALSE</motion.button>
      </div>
    </GameShell>
  );
}

/* ═══════════════════════════════════════════
   GAME 3: WHAT COMES NEXT — Sequence! 🔢🔤
   ═══════════════════════════════════════════ */
function SequenceGame({ onBack }: { onBack: () => void }) {
  const sequences = useRef(shuffleArray([
    { shown: ['A', 'B'], answer: 'C', options: ['C', 'D', 'F'] },
    { shown: ['1', '2'], answer: '3', options: ['3', '5', '4'] },
    { shown: ['D', 'E'], answer: 'F', options: ['G', 'F', 'H'] },
    { shown: ['5', '6'], answer: '7', options: ['8', '7', '9'] },
    { shown: ['X', 'Y'], answer: 'Z', options: ['Z', 'W', 'A'] },
    { shown: ['10', '11'], answer: '12', options: ['13', '12', '14'] },
    { shown: ['🔴', '🟡'], answer: '🟢', options: ['🟢', '🔵', '🟣'] },
    { shown: ['🐶', '🐱'], answer: '🐰', options: ['🐰', '🐻', '🦁'] },
  ]).slice(0, 5)).current;

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const current = sequences[round];

  useEffect(() => {
    if (!gameOver && current) {
      setTimeout(() => speak(`What comes after ${current.shown.join(', ')}?`), 500);
    }
  }, [round, gameOver]);

  const handlePick = (val: string) => {
    if (result) return;
    if (val === current.answer) {
      setResult('correct'); setScore(s => s + 1);
      speak(`Yes! ${current.answer}!`);
    } else {
      setResult('wrong');
      speak('Not quite! Try the next one!');
    }
    setTimeout(() => {
      if (round + 1 >= sequences.length) setGameOver(true);
      else { setRound(r => r + 1); setResult(null); }
    }, 1500);
  };

  if (gameOver) return <GameComplete title="What Comes Next" score={score} total={sequences.length} onBack={onBack} />;

  return (
    <GameShell title="What Comes Next?" subtitle="Complete the pattern!" round={round + 1} total={sequences.length} score={score} onBack={onBack}>
      <motion.div key={round} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        className="flex items-center justify-center gap-4 mb-12"
      >
        {current.shown.map((item, i) => (
          <div key={i} className="w-24 h-24 sm:w-28 sm:h-28 bg-white/80 backdrop-blur-xl border-4 border-white rounded-[2.5rem] flex items-center justify-center text-4xl sm:text-5xl font-black text-blue-800 shadow-xl">{item}</div>
        ))}
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-yellow-100 border-4 border-yellow-300 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-yellow-600 shadow-xl animate-pulse">?</div>
      </motion.div>
      <div className="grid grid-cols-3 gap-6">
        {shuffleArray(current.options).map((opt) => (
          <motion.button key={opt} whileHover={{ scale: 1.08, y: -5 }} whileTap={{ scale: 0.92 }}
            onTap={() => handlePick(opt)}
            className={`h-28 rounded-[2.5rem] font-black text-3xl flex items-center justify-center border-4 transition-all [touch-action:none]
              ${result === 'correct' && opt === current.answer ? 'bg-emerald-100 border-emerald-400 text-emerald-700' 
              : result === 'wrong' && opt !== current.answer ? 'opacity-50' 
              : 'bg-white/80 border-white text-slate-800 hover:border-blue-300 hover:shadow-xl'}`}
          >{opt}</motion.button>
        ))}
      </div>
    </GameShell>
  );
}

/* ═══════════════════════════════════════════
   GAME 4: MEMORY MATCH — Flip & Find Pairs! 🧠🃏
   ═══════════════════════════════════════════ */
function MemoryMatchGame({ onBack }: { onBack: () => void }) {
  const emojis = ['🐶', '🐱', '🦁', '🐸', '🌟', '🎈'];
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const deck = shuffleArray([...emojis, ...emojis].map((emoji, i) => ({
      id: i, emoji, flipped: false, matched: false
    })));
    setCards(deck);
    speak('Find the matching pairs!');
  }, []);

  const handleFlip = (id: number) => {
    if (flippedIds.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped.map(fid => newCards.find(c => c.id === fid)!);
      if (first.emoji === second.emoji) {
        speak('Match!');
        setTimeout(() => {
          const matched = newCards.map(c => c.emoji === first.emoji ? { ...c, matched: true } : c);
          setCards(matched);
          setFlippedIds([]);
          if (matched.every(c => c.matched)) {
            setGameOver(true);
            speak('Wonderful! All pairs found!');
          }
        }, 600);
      } else {
        setTimeout(() => {
          setCards(newCards.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlippedIds([]);
        }, 1000);
      }
    }
  };

  if (gameOver) return <GameComplete title="Memory Match" score={emojis.length} total={emojis.length} onBack={onBack} extra={`${moves} moves`} />;

  return (
    <GameShell title="Memory Match" subtitle="Flip and find the pairs!" round={0} total={0} score={cards.filter(c => c.matched).length / 2} onBack={onBack} hideProgress>
      <div className="grid grid-cols-4 gap-4 sm:gap-5 max-w-lg mx-auto">
        {cards.map(card => (
          <motion.button key={card.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
            onTap={() => handleFlip(card.id)}
            className={`aspect-square rounded-[2rem] flex items-center justify-center text-5xl font-black transition-all border-4 shadow-lg [touch-action:none]
              ${card.matched ? 'bg-emerald-100 border-emerald-300 opacity-60' 
              : card.flipped ? 'bg-white border-blue-300 shadow-xl' 
              : 'bg-blue-600 border-blue-500 hover:bg-blue-500'}`}
          >
            {card.flipped || card.matched ? (
              <span className="select-none">{card.emoji}</span>
            ) : (
              <Star className="text-white/40" size={28} />
            )}
          </motion.button>
        ))}
      </div>
      <p className="text-center mt-8 text-blue-800 font-black text-sm uppercase tracking-[0.3em]">Moves: {moves}</p>
    </GameShell>
  );
}

/* ═══════════════════════════════════════════
   SHARED: GAME SHELL (Layout Wrapper)
   ═══════════════════════════════════════════ */
function GameShell({ title, subtitle, round, total, score, onBack, hideProgress, children }: {
  title: string; subtitle: string; round: number; total: number; score: number; onBack: () => void; hideProgress?: boolean; children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
      className="max-w-2xl mx-auto py-8 px-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onPointerDown={onBack} className="px-5 py-2.5 bg-white/60 backdrop-blur-md text-blue-800 font-black text-sm rounded-2xl border-2 border-white hover:bg-white transition-all [touch-action:none]">← Back</button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-300">
            <Star size={16} className="text-yellow-600 fill-yellow-500" />
            <span className="font-black text-yellow-700 text-sm">{score}</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-blue-900 tracking-tighter mb-2">{title}</h1>
        <p className="text-blue-600 font-bold text-sm">{subtitle}</p>
        {!hideProgress && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {[...Array(total)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all ${i < round ? 'bg-blue-600 scale-110' : 'bg-blue-200'}`} />
            ))}
          </div>
        )}
      </div>

      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SHARED: GAME COMPLETE SCREEN 🏆
   ═══════════════════════════════════════════ */
function GameComplete({ title, score, total, onBack, extra }: { title: string; score: number; total: number; onBack: () => void; extra?: string }) {
  const stars = score === total ? 3 : score >= total * 0.6 ? 2 : 1;
  useEffect(() => { speak(`Amazing! You scored ${score} out of ${total}!`); }, []);
  
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="max-w-md mx-auto py-16 px-4 text-center"
    >
      <div className="bg-white/80 backdrop-blur-xl p-12 rounded-[4rem] border-4 border-white shadow-2xl">
        <div className="text-8xl mb-6 select-none">🏆</div>
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">{title}</h1>
        <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-sm mb-6">Mission Complete!</p>
        
        {/* Stars */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1,2,3].map(i => (
            <motion.div key={i} initial={{ scale: 0, rotate: -30 }} animate={{ scale: i <= stars ? 1 : 0.6, rotate: 0 }} transition={{ delay: i * 0.2 }}>
              <Star size={48} className={i <= stars ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg' : 'text-slate-200'} />
            </motion.div>
          ))}
        </div>
        
        <p className="text-4xl font-black text-blue-700 mb-2">{score}/{total}</p>
        {extra && <p className="text-slate-400 font-bold text-sm">{extra}</p>}
        
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onTap={onBack}
          className="mt-8 w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-lg rounded-2xl shadow-[0_15px_40px_rgba(59,130,246,0.3)] flex items-center justify-center gap-3 [touch-action:none]"
        >Play Again <ArrowRight size={20} /></motion.button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN: GAMES HUB PAGE 🎮
   ═══════════════════════════════════════════ */
const GAME_CATALOG = [
  { id: 'sound', title: 'Sound Match', desc: 'Listen to audio and pick the right answer!', emoji: '🔊', color: 'from-blue-500 to-cyan-500', badge: 'Audio Quest' },
  { id: 'truefalse', title: 'True or False', desc: 'Silly statements — is it true or false?', emoji: '🤪', color: 'from-emerald-500 to-green-500', badge: 'Brain Teaser' },
  { id: 'sequence', title: 'What Comes Next', desc: 'Complete the pattern sequence!', emoji: '🧩', color: 'from-purple-500 to-violet-500', badge: 'Pattern Pro' },
  { id: 'memory', title: 'Memory Match', desc: 'Flip cards and find matching pairs!', emoji: '🧠', color: 'from-rose-500 to-pink-500', badge: 'Memory King' },
];

export default function GamesPlayground() {
  const [mounted, setMounted] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  useEffect(() => { 
    setMounted(true); 
    audioEngine?.warmUp(); // Warm up for zero latency
  }, []);
  if (!mounted) return null;

  return (
    <div className="relative font-sans overflow-hidden pb-10">
      
      {/* ─── ATMOSPHERE: SKY & CLOUDS ─── */}
      <div className="fixed inset-0 select-none pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-blue-300 to-indigo-200" />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }} transition={{ repeat: Infinity, duration: 8 }}
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-yellow-100 rounded-full blur-[100px]" />
        {[...Array(5)].map((_, i) => (
          <motion.div key={i}
            animate={{ x: ['-20vw', '120vw'] }}
            transition={{ repeat: Infinity, duration: 30 + i * 8, delay: i * 5, ease: 'linear' }}
            className="absolute text-white" style={{ top: `${10 + i * 15}%` }}
          ><Cloud size={80 + i * 30} fill="white" className="opacity-30" /></motion.div>
        ))}
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {/* ─── GAME SELECTION HUB ─── */}
          {!activeGame && (
            <motion.div key="hub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}
              className="max-w-6xl mx-auto px-6 pt-16"
            >
              {/* Hero */}
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/60 backdrop-blur-md text-blue-800 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-6 border-2 border-white shadow-sm">
                  <Gamepad2 size={14} /> Fun Activity Hub
                </div>
                <h1 className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none mb-4 drop-shadow-lg">
                  Game <span className="text-yellow-300 italic">Playground</span>
                </h1>
                <p className="text-blue-50 font-bold text-lg max-w-md mx-auto">Pick a game, play, and earn stars! Every game makes you a genius! 🌟</p>
              </div>

              {/* Game Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {GAME_CATALOG.map((game, i) => (
                  <motion.button key={game.id}
                    initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
                    whileHover={{ y: -10, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onTap={() => setActiveGame(game.id)}
                    className="group relative bg-white/70 backdrop-blur-xl border-4 border-white rounded-[4rem] p-10 text-left transition-all shadow-lg hover:shadow-2xl overflow-hidden"
                  >
                    {/* BG Gradient on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                    
                    <div className="flex items-start gap-6 relative z-10">
                      <div className={`w-20 h-20 rounded-[1.5rem] bg-gradient-to-br ${game.color} flex items-center justify-center text-4xl shadow-xl group-hover:rotate-6 transition-transform`}>
                        {game.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{game.title}</h3>
                        </div>
                        <p className="text-slate-400 font-bold text-sm mb-4">{game.desc}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <Sparkles size={12} className="text-yellow-500" /> {game.badge}
                        </div>
                      </div>
                    </div>

                    {/* Play Arrow */}
                    <div className="absolute top-1/2 right-8 -translate-y-1/2 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.4)]">
                      <Play size={22} className="text-white fill-white" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── ACTIVE GAME ─── */}
          {activeGame === 'sound' && <SoundMatchGame key="sound" onBack={() => setActiveGame(null)} />}
          {activeGame === 'truefalse' && <TrueOrFalseGame key="tf" onBack={() => setActiveGame(null)} />}
          {activeGame === 'sequence' && <SequenceGame key="seq" onBack={() => setActiveGame(null)} />}
          {activeGame === 'memory' && <MemoryMatchGame key="mem" onBack={() => setActiveGame(null)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
