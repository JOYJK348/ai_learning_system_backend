'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, RefreshCw, Trophy, Star, Heart, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { audioEngine } from '@/core/utils/audio';

/* ─────────── TYPES ─────────── */
interface QuizOption {
  n: string;
  e: string;
}

interface QuizData {
  question: string;
  options: QuizOption[];
  correct: string;
}

interface LessonData {
  id: string;
  title: string;
  emoji: string;
  quiz: QuizData;
}

interface QuizEngineProps {
  lesson: LessonData;
  onClose: () => void;
  onComplete: (lessonId: string) => void;
}

/* ─────────── CONFETTI PARTICLE ─────────── */
const CONFETTI_COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98FB98'];

function ConfettiParticle({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const startX = 50 + (Math.random() - 0.5) * 40;
  const endX = startX + (Math.random() - 0.5) * 80;
  const size = 6 + Math.random() * 8;
  const duration = 1.5 + Math.random() * 1;
  const rotation = Math.random() * 720;
  
  return (
    <motion.div
      initial={{ x: `${startX}vw`, y: '40vh', opacity: 1, rotate: 0, scale: 0 }}
      animate={{ 
        x: `${endX}vw`, 
        y: '-10vh', 
        opacity: [1, 1, 0], 
        rotate: rotation,
        scale: [0, 1.5, 1]
      }}
      transition={{ duration, ease: 'easeOut' }}
      className="fixed z-[200] pointer-events-none"
      style={{ width: size, height: size, backgroundColor: color, borderRadius: size > 10 ? '50%' : '2px' }}
    />
  );
}

function speak(text: string) {
  audioEngine?.speak(text);
}

/* ─────────── MAIN QUIZ ENGINE ─────────── */
export default function QuizEngine({ lesson, onClose, onComplete }: QuizEngineProps) {
  const [phase, setPhase] = useState<'intro' | 'question' | 'correct' | 'wrong' | 'complete'>('intro');
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);

  const quiz = lesson.quiz;

  // ─── INTRO PHASE: Announce the lesson ───
  useEffect(() => {
    if (phase === 'intro') {
      audioEngine?.warmUp(); // Ensure engine is awake
      speak(lesson.title);
      const timer = setTimeout(() => {
        setPhase('question');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, lesson.title]);

  // ─── QUESTION PHASE: Ask the question ───
  useEffect(() => {
    if (phase === 'question') {
      const timer = setTimeout(() => {
        speak(quiz.question);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, quiz.question]);

  // ─── HANDLE OPTION TAP ───
  const handleTap = useCallback((option: QuizOption) => {
    if (phase !== 'question') return;
    setSelectedOption(option.n);

    if (option.n === quiz.correct) {
      // ✅ CORRECT!
      setPhase('correct');
      setShowConfetti(true);
      speak('Wonderful! You got it right!');
      setStreak(prev => prev + 1);
      
      setTimeout(() => {
        setShowConfetti(false);
        setPhase('complete');
        onComplete(lesson.id);
      }, 3000);
    } else {
      // ❌ WRONG — Gentle bounce
      setPhase('wrong');
      setWrongCount(prev => prev + 1);
      speak('Oops! Try again!');

      if (wrongCount >= 1) {
        // After 2 wrong attempts, show hint glow
        setShowHint(true);
      }

      setTimeout(() => {
        setSelectedOption(null);
        setPhase('question');
      }, 1800);
    }
  }, [phase, quiz.correct, wrongCount, lesson.id, onComplete]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center font-sans bg-indigo-950">
        
        {/* CLOSE BUTTON */}
        <button 
          onPointerDown={onClose}
          className="absolute top-4 right-4 z-50 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/20 active:scale-95 [touch-action:none]"
        >
          <X className="text-white" size={20} />
        </button>

        {/* ═══════════════════════════════════
            INTRO PHASE
            ═══════════════════════════════════ */}
        {phase === 'intro' && (
          <div className="relative z-10 flex flex-col items-center text-center px-8">
            <div className="text-[100px] mb-6 select-none animate-pulse">
              {lesson.emoji}
            </div>
            <h1 className="text-3xl font-black text-white mb-2">{lesson.title}</h1>
            <p className="text-blue-300 font-bold uppercase tracking-widest text-xs">Ready?</p>
          </div>
        )}

        {/* ═══════════════════════════════════
            QUESTION PHASE
            ═══════════════════════════════════ */}
        {(phase === 'question' || phase === 'wrong') && (
          <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
            {/* Question Card */}
            <div className={`bg-white rounded-[2rem] p-6 w-full text-center mb-8 border-b-4 ${phase === 'wrong' ? 'border-red-500' : 'border-slate-200'}`}>
               <div className="text-6xl mb-4">{lesson.emoji}</div>
               <h2 className="text-xl font-black text-slate-900">{quiz.question}</h2>
               {phase === 'wrong' && <p className="text-red-500 font-bold mt-2">Try again! 🤗</p>}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-3 gap-4 w-full">
              {quiz.options.map((opt) => (
                <button
                  key={opt.n}
                  onPointerDown={() => handleTap(opt)}
                  disabled={phase === 'wrong'}
                  className="aspect-square bg-white rounded-[2rem] flex flex-col items-center justify-center border-b-4 border-slate-100 active:bg-blue-50 transition-colors [touch-action:none]"
                >
                  <span className="text-5xl mb-1">{opt.e}</span>
                  <span className="text-slate-500 font-black text-[10px] uppercase">{opt.n}</span>
                </button>
              ))}
            </div>

            {/* Hearts */}
            <div className="flex items-center gap-2 mt-8">
              {[0, 1, 2].map(i => (
                <Heart 
                  key={i} 
                  size={16} 
                  className={i < (3 - wrongCount) ? 'text-rose-500 fill-rose-500' : 'text-white/20'} 
                />
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════
            CORRECT PHASE
            ═══════════════════════════════════ */}
        {phase === 'correct' && (
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="text-8xl mb-4">🎉</div>
            <h1 className="text-4xl font-black text-white">Great! 🌟</h1>
          </div>
        )}

        {/* ═══════════════════════════════════
            COMPLETE PHASE
            ═══════════════════════════════════ */}
        {phase === 'complete' && (
          <div className="relative z-10 w-full max-w-sm px-6">
            <div className="bg-white rounded-[3rem] p-10 text-center border-b-4 border-slate-200">
               <div className="text-7xl mb-4">{lesson.emoji}</div>
               <h2 className="text-2xl font-black text-slate-900 mb-6">Mission Done!</h2>
               <button 
                 onPointerDown={onClose}
                 className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-md active:scale-95 [touch-action:none]"
               >
                 CONTINUE
               </button>
            </div>
          </div>
        )}
    </div>
  );
}
