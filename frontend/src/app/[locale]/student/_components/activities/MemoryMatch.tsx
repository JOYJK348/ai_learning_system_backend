'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getLetterData, shuffle } from '@/core/data/letterData';

type Props = {
  config: { pairs?: { a: string; b: string }[] };
  onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => void;
};

const BG_GRADIENTS = [
  'from-pink-400 to-rose-500',
  'from-orange-400 to-amber-500',
  'from-sky-400 to-blue-500',
  'from-green-400 to-emerald-500',
  'from-purple-400 to-violet-500',
  'from-teal-400 to-cyan-500',
];

type Card = { id: string; letter: string; emoji: string; color: string; gradient: string; flipped: boolean; matched: boolean };

export default function MemoryMatch({ config, onComplete }: Props) {
  const pairs = (config.pairs || []).slice(0, 4);
  const [cards, setCards] = useState<Card[]>(() => {
    const all: Card[] = [];
    pairs.forEach((p, idx) => {
      const data = getLetterData(p.a);
      const g = BG_GRADIENTS[idx % BG_GRADIENTS.length];
      all.push({ id: `l-${idx}`, letter: p.a, emoji: data.emoji, color: data.color, gradient: g, flipped: false, matched: false });
      all.push({ id: `w-${idx}`, letter: p.a, emoji: data.emoji, color: data.color, gradient: g, flipped: false, matched: false });
    });
    return shuffle(all);
  });
  const [firstPick, setFirstPick] = useState<string | null>(null);
  const [matched, setMatched] = useState(0);
  const [lock, setLock] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [done, setDone] = useState(false);
  const startTime = useRef(Date.now());
  const totalPairs = pairs.length;

  useEffect(() => {
    const t = setTimeout(() => setShowAll(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const handleFlip = (id: string) => {
    if (lock || showAll || done) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.matched || card.flipped) return;

    const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setCards(newCards);

    if (!firstPick) { setFirstPick(id); return; }

    const first = cards.find(c => c.id === firstPick)!;
    setLock(true);

    if (first.letter === newCards.find(c => c.id === id)!.letter) {
      setTimeout(() => {
        setCards(prev => prev.map(c => c.id === first.id || c.id === id ? { ...c, matched: true } : c));
        setMatched(m => { const n = m + 1; if (n >= totalPairs) setTimeout(() => setDone(true), 500); return n; });
        setFirstPick(null); setLock(false);
      }, 400);
    } else {
      setWrongFlash(true);
      setTimeout(() => setWrongFlash(false), 400);
      setTimeout(() => {
        setCards(prev => prev.map(c => c.id === first.id || c.id === id ? { ...c, flipped: false } : c));
        setFirstPick(null); setLock(false);
      }, 1000);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 px-6 py-10">
        <motion.span animate={{ rotate: [0,10,-10,0], scale: [1,1.15,1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-7xl">🧠</motion.span>
        <h2 className="text-3xl font-black text-white drop-shadow-lg text-center">Memory Master!</h2>
        <p className="text-lg font-bold text-white/70 text-center">Matched {matched}/{totalPairs} pairs!</p>
        <motion.button whileTap={{ scale: 0.92 }}
          onClick={() => onComplete({ score: 100, max_score: 100, completion_data: { matched, total: totalPairs }, time_taken_seconds: Math.round((Date.now()-startTime.current)/1000) })}
          className="px-10 py-4 bg-white/25 backdrop-blur-md text-white font-black text-lg rounded-full border-2 border-white/40">Next ➡️</motion.button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 px-3 py-5 ${wrongFlash ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
      <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-lg text-center">🧠 Match letter + picture!</h3>
      {showAll && <p className="text-sm font-bold text-yellow-200">👀 Remember the cards!</p>}

      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-sm w-full">
        {cards.map((card) => {
          const isFlipped = card.flipped || card.matched || showAll;
          return (
            <motion.button key={card.id} whileTap={{ scale: 0.92 }} onClick={() => handleFlip(card.id)}
              className={`aspect-[3/4] rounded-xl sm:rounded-2xl shadow-lg border-2 transition-all ${isFlipped ? card.matched ? 'border-emerald-400 opacity-70' : 'border-white/60' : 'border-white/30 bg-white/20 hover:bg-white/30'}`}>
              <motion.div animate={{ rotateY: isFlipped ? 0 : 180 }} className="w-full h-full rounded-xl sm:rounded-2xl flex items-center justify-center">
                {isFlipped ? (
                  <div className="w-full h-full rounded-xl sm:rounded-2xl flex flex-col items-center justify-center gap-0.5" style={{ background: card.color }}>
                    <span className="text-2xl sm:text-3xl drop-shadow-md">{card.emoji}</span>
                    <span className="text-lg sm:text-xl font-black text-white drop-shadow-md leading-none">{card.letter}</span>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl opacity-50">❓</span>
                  </div>
                )}
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-1">
        {Array.from({ length: totalPairs }).map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-full ${i < matched ? 'bg-green-400' : 'bg-white/30'}`} />
        ))}
      </div>

      <p className="text-[10px] font-bold text-white/50 text-center">
        {showAll ? '⏳ Watch carefully...' : '👆 Flip two matching cards!'}
      </p>
    </div>
  );
}
