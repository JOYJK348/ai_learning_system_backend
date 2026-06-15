'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Star, CheckCircle, XCircle, ArrowRight, Play, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { audioEngine } from '@/core/utils/audio';

/* ── UTILS ── */
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

/* ── SHARED: GAME SHELL ── */
function GameShell({ title, subtitle, round, total, score, onBack, hideProgress, children }: {
  title: string; subtitle: string; round: number; total: number; score: number; onBack: () => void; hideProgress?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full font-sans overflow-hidden">
      {/* ─── GLOBAL MAGICAL SKY ATMOSPHERE ─── */}
      <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500" />
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)' , backgroundSize: '40px 40px' }} />
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-blue-300/30 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 max-w-2xl mx-auto pt-8 pb-40 px-6"
      >
        {/* Navigation Head */}
        <div className="flex items-center justify-between mb-10">
          <button 
            onPointerDown={onBack} 
            className="flex items-center gap-2 px-6 py-3 bg-white/40 backdrop-blur-xl text-indigo-950 font-black text-xs uppercase tracking-widest rounded-2xl border border-white/60 hover:bg-white/60 transition-all shadow-xl active:scale-95 [touch-action:none]"
          >
            <ArrowLeft size={18} /> Back
          </button>
          
          <div className="flex items-center gap-3 bg-amber-400 px-6 py-3 rounded-2xl border-2 border-white shadow-xl">
            <Star size={18} className="text-indigo-950 fill-indigo-950" />
            <span className="font-black text-indigo-950 text-sm tracking-tighter">{score} Stars</span>
          </div>
        </div>

        {/* Header Info */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-6xl font-black text-indigo-950 tracking-tighter mb-2 leading-none drop-shadow-sm">{title}</h1>
          <p className="text-indigo-900 font-bold text-sm sm:text-base opacity-70">{subtitle}</p>
          
          {!hideProgress && total > 0 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              {[...Array(total)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i < round ? 'bg-indigo-600 scale-125 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-white/30 border border-white/40'}`} />
              ))}
            </div>
          )}
        </div>

        {children}
      </motion.div>
    </div>
  );
}

/* ── SHARED: GAME COMPLETE ── */
function GameComplete({ title, score, total, onBack, extra }: { title: string; score: number; total: number; onBack: () => void; extra?: string }) {
  const stars = score === total ? 3 : score >= total * 0.6 ? 2 : 1;
  useEffect(() => { speak(`Amazing! You scored ${score} out of ${total}!`); }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center font-sans overflow-hidden">
      {/* ─── GLOBAL MAGICAL SKY ATMOSPHERE ─── */}
      <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500" />
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)' , backgroundSize: '40px 40px' }} />
      </div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 max-w-md w-full px-6 text-center"
      >
        <div className="bg-white/40 backdrop-blur-3xl p-10 sm:p-14 rounded-[3.5rem] border-2 border-white/60 shadow-2xl relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-400 rounded-3xl flex items-center justify-center text-4xl shadow-2xl border-4 border-white transform -rotate-12">
            🏆
          </div>
          
          <div className="mt-8 mb-4">
             <h1 className="text-3xl font-black text-indigo-950 tracking-tighter mb-1 leading-none">{title}</h1>
             <p className="text-indigo-900/60 font-black uppercase tracking-[0.3em] text-[10px]">Mission Complete!</p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-10">
            {[1,2,3].map(i => (
              <motion.div key={i} initial={{ scale: 0, rotate: -30 }} animate={{ scale: i <= stars ? 1 : 0.6, rotate: 0 }} transition={{ delay: i * 0.2 }}>
                <Star size={42} className={i <= stars ? 'text-amber-500 fill-amber-500 drop-shadow-lg' : 'text-white/20'} />
              </motion.div>
            ))}
          </div>

          <div className="bg-indigo-950/5 rounded-3xl py-6 mb-8 border border-white/30">
             <span className="text-[10px] font-black text-indigo-950/40 uppercase tracking-widest block mb-1">Final Score</span>
             <p className="text-5xl font-black text-indigo-950 tracking-tighter leading-none">{score}<span className="text-indigo-950/30">/{total}</span></p>
             {extra && <p className="text-indigo-950/60 font-bold text-xs mt-3 uppercase tracking-widest">{extra}</p>}
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={onBack}
            className="w-full py-5 bg-indigo-600 text-white font-black text-sm uppercase tracking-[0.3em] rounded-2xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            Done <ArrowRight size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ═══════ GAME 1: SOUND MATCH 🔊 ═══════ */
export function SoundMatchGame({ onBack }: { onBack: () => void }) {
  const { subjects } = useData();
  const allLessons = subjects.flatMap(s => s.chapters.flatMap(c => c.lessons.map(l => ({
    id: l.id,
    title: l.title,
    emoji: '📚',
    color: 'bg-sky-100',
    text: 'text-sky-600',
    border: 'border-sky-300',
    status: l.progress?.status || 'not-started',
    quiz: null,
  }))));
  const totalRounds = 5;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const rounds = useRef(
    shuffleArray(allLessons).slice(0, totalRounds).map(lesson => {
      const wrong = shuffleArray(allLessons.filter(l => l.id !== lesson.id)).slice(0, 2);
      return { answer: lesson, options: shuffleArray([lesson, ...wrong]) };
    })
  ).current;
  const cur = rounds[round];

  useEffect(() => {
    if (!gameOver && cur) setTimeout(() => speak(`Find the ${cur.answer.title.replace(/^[A-Z] for /, '')}`), 600);
  }, [round, gameOver]);

  const handlePick = (opt: any) => {
    if (result) return;
    setSelected(opt.id);
    if (opt.id === cur.answer.id) {
      setResult('correct'); setScore(s => s + 1); speak('Great job!');
      setTimeout(() => { if (round + 1 >= totalRounds) setGameOver(true); else { setRound(r => r + 1); setSelected(null); setResult(null); } }, 1500);
    } else {
      setResult('wrong'); speak('Try again!');
      setTimeout(() => { setSelected(null); setResult(null); }, 1200);
    }
  };

  if (gameOver) return <GameComplete title="Sound Match" score={score} total={totalRounds} onBack={onBack} />;
  return (
    <GameShell title="Sound Match" subtitle="Listen and tap the right one!" round={round + 1} total={totalRounds} score={score} onBack={onBack}>
      <button 
        onPointerDown={() => speak(`Find the ${cur.answer.title.replace(/^[A-Z] for /, '')}`)} 
        className="mx-auto mb-10 w-28 h-28 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group border-4 border-white/20 [touch-action:none]"
      >
        <Volume2 className="text-white animate-pulse" size={40} />
      </button>
      
      <div className="grid grid-cols-3 gap-5 sm:gap-8">
        {cur.options.map((opt: any) => (
          <motion.button 
            key={opt.id} 
            whileHover={{ scale: 1.05, y: -5 }} 
            whileTap={{ scale: 0.95 }} 
            onTap={() => handlePick(opt)}
            className={`relative aspect-square rounded-[2.5rem] flex flex-col items-center justify-center border-2 transition-all p-4 [touch-action:none]
              ${selected === opt.id && result === 'correct' ? 'bg-emerald-400/30 border-emerald-400 shadow-xl' 
              : selected === opt.id && result === 'wrong' ? 'bg-rose-400/30 border-rose-400' 
              : 'bg-white/40 border-white/60 hover:bg-white/60 shadow-xl backdrop-blur-3xl'}`}
          >
            <span className="text-5xl sm:text-7xl mb-3 select-none drop-shadow-md">{opt.emoji}</span>
            <span className="text-[10px] font-black text-indigo-950/60 uppercase tracking-widest">{opt.title.replace(/^[A-Z] for /, '').replace(/^Number /, '')}</span>
          </motion.button>
        ))}
      </div>
    </GameShell>
  );
}

/* ═══════ GAME 2: TRUE OR FALSE 🤪 ═══════ */
const SILLY_QS = [
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

export function TrueOrFalseGame({ onBack }: { onBack: () => void }) {
  const questions = useRef(shuffleArray(SILLY_QS).slice(0, 5)).current;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const cur = questions[round];

  useEffect(() => { if (!gameOver && cur) setTimeout(() => speak(cur.q), 500); }, [round, gameOver]);

  const handleAnswer = (ans: boolean) => {
    if (result) return;
    if (ans === cur.a) { setResult('correct'); setScore(s => s + 1); speak(ans ? 'Yes! Correct!' : 'No way! You got it!'); }
    else { setResult('wrong'); speak("Oops! That's not right!"); }
    setTimeout(() => { if (round + 1 >= questions.length) setGameOver(true); else { setRound(r => r + 1); setResult(null); } }, 1500);
  };

  if (gameOver) return <GameComplete title="True or False" score={score} total={questions.length} onBack={onBack} />;
  return (
    <GameShell title="True or False" subtitle="Is this silly statement true?" round={round + 1} total={questions.length} score={score} onBack={onBack}>
      <motion.div 
        key={round} 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white/40 backdrop-blur-3xl p-8 sm:p-14 rounded-[3.5rem] border-2 border-white/60 shadow-2xl mb-12 text-center relative overflow-hidden"
      >
        <span className="text-8xl block mb-8 select-none drop-shadow-xl">{cur.emoji}</span>
        <h2 className="text-3xl font-black text-indigo-950 leading-tight mb-4 tracking-tighter">{cur.q}</h2>
        
        <AnimatePresence mode="wait">
          {result && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center mt-6">
              <div className={`px-8 py-3 rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-xl border-2 ${result === 'correct' ? 'bg-emerald-400/40 border-emerald-400 text-emerald-950' : 'bg-rose-400/40 border-rose-400 text-rose-950'}`}>
                {result === 'correct' ? '🎉 Amazing!' : '😅 Not Quite!'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex justify-center gap-4 sm:gap-6 px-4 max-w-sm mx-auto">
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onTap={() => handleAnswer(true)}
          className="flex-1 h-16 sm:h-20 rounded-[1.5rem] bg-emerald-500 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(16,185,129,0.3)] border-b-[6px] border-emerald-700 active:border-b-0 active:translate-y-2 transition-all [touch-action:none]"
        >
          <CheckCircle size={24} className="sm:w-7 sm:h-7" /> TRUE
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onTap={() => handleAnswer(false)}
          className="flex-1 h-16 sm:h-20 rounded-[1.5rem] bg-rose-500 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(244,63,94,0.3)] border-b-[6px] border-rose-700 active:border-b-0 active:translate-y-2 transition-all [touch-action:none]"
        >
          <XCircle size={24} className="sm:w-7 sm:h-7" /> FALSE
        </motion.button>
      </div>
    </GameShell>
  );
}

/* ═══════ GAME 3: WHAT COMES NEXT 🧩 ═══════ */
export function SequenceGame({ onBack }: { onBack: () => void }) {
  const seqs = useRef(shuffleArray([
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
  const cur = seqs[round];

  useEffect(() => { if (!gameOver && cur) setTimeout(() => speak(`What comes after ${cur.shown.join(', ')}?`), 500); }, [round, gameOver]);

  const handlePick = (val: string) => {
    if (result) return;
    if (val === cur.answer) { setResult('correct'); setScore(s => s + 1); speak(`Yes! ${cur.answer}!`); }
    else { setResult('wrong'); speak('Not quite!'); }
    setTimeout(() => { if (round + 1 >= seqs.length) setGameOver(true); else { setRound(r => r + 1); setResult(null); } }, 1500);
  };

  if (gameOver) return <GameComplete title="Sequence Quest" score={score} total={seqs.length} onBack={onBack} />;
  return (
    <GameShell title="Sequence Quest" subtitle="Complete the pattern!" round={round + 1} total={seqs.length} score={score} onBack={onBack}>
      <motion.div key={round} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center justify-center gap-4 mb-12">
        {cur.shown.map((item, i) => (
          <div key={i} className="w-20 h-20 sm:w-28 sm:h-28 bg-white/40 backdrop-blur-3xl border-2 border-white/60 rounded-[2.5rem] flex items-center justify-center text-4xl sm:text-5xl font-black text-indigo-950 shadow-2xl">{item}</div>
        ))}
        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-amber-400/40 border-4 border-amber-400 rounded-[2.5rem] flex items-center justify-center text-5xl font-black text-amber-600 shadow-xl animate-pulse backdrop-blur-md">?</div>
      </motion.div>
      
      <div className="grid grid-cols-3 gap-5 sm:gap-8 px-2">
        {shuffleArray(cur.options).map((opt) => (
          <motion.button 
            key={opt} 
            whileHover={{ scale: 1.05, y: -5 }} 
            whileTap={{ scale: 0.95 }} 
            onTap={() => handlePick(opt)}
            className={`h-20 sm:h-28 rounded-[2.5rem] font-black text-4xl flex items-center justify-center border-2 transition-all shadow-xl [touch-action:none]
              ${result === 'correct' && opt === cur.answer ? 'bg-emerald-400 border-emerald-500 text-white' : 'bg-white/40 backdrop-blur-3xl border-white/60 text-indigo-950 hover:bg-white/60'}`}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </GameShell>
  );
}

/* ═══════ GAME 4: MEMORY MATCH 🧠 ═══════ */
export function MemoryMatchGame({ onBack }: { onBack: () => void }) {
  const emojis = ['🐶', '🐱', '🦁', '🐸', '🌟', '🎈'];
  const [cards, setCards] = useState<{ id: number; emoji: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    setCards(shuffleArray([...emojis, ...emojis].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))));
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
          setCards(matched); setFlippedIds([]);
          if (matched.every(c => c.matched)) { setGameOver(true); speak('All pairs found!'); }
        }, 600);
      } else {
        setTimeout(() => { setCards(newCards.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c)); setFlippedIds([]); }, 1000);
      }
    }
  };

  if (gameOver) return <GameComplete title="Memory Arena" score={emojis.length} total={emojis.length} onBack={onBack} extra={`${moves} moves`} />;
  return (
    <GameShell title="Memory Arena" subtitle="Find all the matching pairs!" round={0} total={0} score={cards.filter(c => c.matched).length / 2} onBack={onBack} hideProgress>
      <div className="grid grid-cols-4 gap-4 sm:gap-6 max-w-lg mx-auto">
        {cards.map(card => (
          <motion.button 
            key={card.id} 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onTap={() => handleFlip(card.id)}
            className={`aspect-square rounded-3xl flex items-center justify-center text-4xl sm:text-5xl font-black transition-all border-2 shadow-2xl relative overflow-hidden [touch-action:none]
              ${card.matched ? 'bg-emerald-400/40 border-emerald-400/50 opacity-40' 
              : card.flipped ? 'bg-white/90 border-indigo-400 shadow-xl' 
              : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-700 shadow-indigo-900/10'}`}
          >
            <AnimatePresence mode="wait">
              {card.flipped || card.matched ? (
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="select-none">{card.emoji}</motion.span>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center">
                   <Sparkles className="text-white/40 group-hover:text-white" size={32} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      
      <div className="mt-12 flex justify-center">
         <div className="px-10 py-4 bg-indigo-950/10 backdrop-blur-md rounded-full border border-indigo-950/20 shadow-xl">
            <p className="text-indigo-950 font-black text-sm uppercase tracking-[0.4em]">Moves: <span className="text-indigo-600">{moves}</span></p>
         </div>
      </div>
    </GameShell>
  );
}
