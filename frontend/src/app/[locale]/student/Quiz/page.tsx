'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Star, Zap, Target, 
  Gamepad2, Calendar, ChevronRight,
  Sparkles, Award, Play, Cloud, Sun,
  ArrowLeft
} from 'lucide-react';
import { audioEngine } from '@/core/utils/audio';
import QuizEngine from '../_components/QuizEngine';
import { SoundMatchGame, TrueOrFalseGame, SequenceGame, MemoryMatchGame } from '../_components/GameActivities';
import { useData } from '@/context/DataContext';

export default function QuizArena() {
  const { subjects } = useData();
  const [mounted, setMounted] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [activeGame, setActiveGame] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    audioEngine?.warmUp(); // Prepare speech engine
    if (activeQuiz || activeGame) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [activeQuiz, activeGame]);

  const allLessonsFlat = subjects.flatMap(s => s.chapters.flatMap(c => c.lessons));
  const categoriesFromAPI = subjects.map((s, idx) => ({
    id: s.id,
    title: s.name,
    icon: null,
    color: ['bg-rose-100 text-rose-500', 'bg-blue-100 text-blue-500', 'bg-emerald-100 text-emerald-500', 'bg-amber-100 text-amber-500'][idx % 4],
    border: ['border-rose-200', 'border-blue-200', 'border-emerald-200', 'border-amber-200'][idx % 4],
    progress: s.chapters.length > 0 ? Math.round(s.chapters.filter(c => c.completion_percentage >= 100).length / s.chapters.length * 100) : 0,
    lessons: s.chapters.flatMap(c => c.lessons).length,
  }));

  const startDailyThree = () => {
    const randomLesson = allLessonsFlat[Math.floor(Math.random() * allLessonsFlat.length)];
    if (randomLesson) {
      setActiveQuiz({
        id: randomLesson.id,
        title: randomLesson.title,
        emoji: '📚',
        color: 'bg-sky-100',
        text: 'text-sky-600',
        border: 'border-sky-300',
        status: randomLesson.progress?.status || 'not-started',
        quiz: { question: `Let's learn ${randomLesson.title}!`, options: [
          { n: 'A', e: '🌟' }, { n: 'B', e: '🚀' }, { n: 'C', e: '💫' }
        ], correct: 'A' }
      });
    }
  };

  return (
    <div className="relative font-sans overflow-hidden bg-sky-400">
      
      {/* ─── GLOBAL MAGICAL SKY ATMOSPHERE (Always Visible for Zero Latency) ─── */}
      <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)' , backgroundSize: '40px 40px' }} />
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/20 blur-[120px] rounded-full" />
      </div>

      {!mounted ? (
        /* SKELETON SHELL for 2G RAM / SLOW LOAD */
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6">
           <div className="w-full h-64 bg-white/20 rounded-[3.5rem] animate-pulse" />
        </div>
      ) : (
        <div className="relative z-10 w-full">
        <div className="w-full max-w-7xl mx-auto px-6">
          
          {/* 1. HERO SECTION (SEAMLESS) */}
          <div className="py-10 mb-8 w-full border-b-8 border-white/10">
             <div className="relative w-full flex items-center">
                <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-white/30 to-transparent skew-x-[-20deg] transform translate-x-32" />
                
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10 w-full max-w-7xl mx-auto px-2 sm:px-6">
                   <div className="text-center md:text-left flex-1 space-y-6">
                      <div className="inline-flex items-center gap-2 px-6 py-2 bg-amber-400 text-indigo-950 rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-xl">
                         <Trophy size={16} fill="currentColor" /> Daily Quest
                      </div>
                      <h1 className="text-4xl sm:text-7xl font-black text-indigo-950 tracking-tighter leading-tight">
                         The <span className="text-indigo-800 italic">Daily 3</span> <br/>
                         Quest Arena
                      </h1>
                      <p className="text-indigo-900/60 font-bold text-lg">Win 3 questions today to earn a Magical Star! 🌟🌸</p>
                      
                      <div className="flex justify-center md:justify-start w-full">
                        <button 
                          onClick={startDailyThree}
                          className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 group/btn"
                        >
                           ENTER ARENA <Play className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                   </div>

                   <div className="relative w-64 h-64 sm:w-80 sm:h-80 select-none">
                      <div className="absolute inset-0 bg-indigo-600/10 blur-[60px] rounded-full animate-pulse" />
                      <img 
                        src="/assets/avatars/owl-removebg-preview.png" 
                        className="w-full h-full object-contain animate-[float_4s_ease-in-out_infinite]" 
                        alt="Arena Master" 
                      />
                   </div>
                </div>
             </div>
          </div>

          {/* 2. ENERGETIC STATS (GLASSMORPHIC) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
             {[
               { label: 'Weekly Streak', val: '5 Days', icon: Calendar, color: 'text-rose-600', glow: 'bg-rose-400' },
               { label: 'Quiz Won', val: '43', icon: Trophy, color: 'text-amber-600', glow: 'bg-amber-400' },
               { label: 'Arena Level', val: 'Level 4', icon: Target, color: 'text-blue-600', glow: 'bg-blue-400' },
               { label: 'Global Rank', val: '#12', icon: Award, color: 'text-purple-600', glow: 'bg-purple-400' },
             ].map((stat, i) => (
               <div key={i} className="bg-white/40 backdrop-blur-3xl rounded-[2.5rem] p-6 sm:p-8 text-center border-2 border-white/60 shadow-2xl relative overflow-hidden group active:scale-95 transition-all">
                  <div className={`absolute -top-10 -right-10 w-24 h-24 ${stat.glow} opacity-10 blur-3xl rounded-full`} />
                  <stat.icon className={`${stat.color} mb-3 mx-auto`} size={28} />
                  <span className="text-xl sm:text-2xl font-black text-indigo-950 block mb-0.5 leading-tight">{stat.val}</span>
                  <span className="text-[10px] sm:text-[11px] font-black text-indigo-950/40 uppercase tracking-widest">{stat.label}</span>
               </div>
             ))}
          </div>

          {/* 3. PRACTICE CLOUDS (MAGIC BUBBLE PORTALS) */}
          <div className="mb-16">
             <div className="flex items-center gap-4 mb-10 px-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                   <Cloud className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-indigo-950 leading-none">Practice Clouds</h2>
                  <p className="text-[10px] font-bold text-indigo-950/40 uppercase tracking-widest mt-1">Jump into a subject</p>
                </div>
             </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                 {categoriesFromAPI.length === 0 && (
                   <div className="col-span-full text-center py-12">
                     <p className="text-white/60 font-black text-lg">No subjects available yet. Start learning!</p>
                   </div>
                 )}
                 {categoriesFromAPI.map((zone, idx) => (
                   <button
                     key={zone.id}
                     onClick={() => {
                       const zoneLessons = allLessonsFlat.filter(l => zone.id === subjects[idx]?.id);
                       if (zoneLessons.length > 0) {
                         setActiveQuiz({
                           id: zoneLessons[0].id,
                           title: zoneLessons[0].title,
                           emoji: '📚',
                           color: 'bg-sky-100',
                           text: 'text-sky-600',
                           border: 'border-sky-300',
                           status: 'not-started',
                           quiz: { question: `Let's learn ${zoneLessons[0].title}!`, options: [
                             { n: 'A', e: '🌟' }, { n: 'B', e: '🚀' }, { n: 'C', e: '💫' }
                           ], correct: 'A' }
                         });
                       }
                     }}
                     className="group relative"
                   >
                     <div className={`absolute inset-0 blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${
                       idx === 0 ? 'bg-orange-400' : 
                       idx === 1 ? 'bg-blue-400' : 
                       idx === 2 ? 'bg-pink-400' : 'bg-emerald-400'
                     }`} />
                     
                     <div className={`relative backdrop-blur-3xl rounded-[3.5rem] p-2 border-2 transition-all duration-700 group-hover:-translate-y-6 will-change-transform ${
                       idx === 0 ? 'bg-orange-400/20 border-orange-300 shadow-xl' : 
                       idx === 1 ? 'bg-blue-400/20 border-blue-300 shadow-xl' : 
                       idx === 2 ? 'bg-pink-400/20 border-pink-300 shadow-xl' : 
                       'bg-emerald-400/20 border-emerald-300 shadow-xl'
                     }`}>
                       <div className="min-h-[280px] flex flex-col items-center justify-center p-8 relative overflow-hidden text-center">
                          <div className="w-24 h-24 flex items-center justify-center mb-6 drop-shadow-[0_20px_20px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-700">
                             <img 
                                src={`/assets/portals/${['alphabet', 'numbers', 'colors', 'animals'][idx % 4]}-removebg-preview.png`}
                                className="w-full h-full object-contain"
                                alt={zone.title}
                             />
                          </div>
                          <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight mb-6 leading-none">{zone.title}</h3>
                          <div className="px-8 py-3 bg-indigo-600 rounded-2xl text-[10px] font-black text-white shadow-xl hover:bg-indigo-700 transition-colors uppercase tracking-widest">
                             JUMP IN!
                          </div>
                       </div>
                    </div>
                  </button>
                ))}
             </div>
          </div>

          {/* 4. FUN ACTIVITIES (GLASSMORPHIC) */}
          <div className="mt-12 mb-20">
             <div className="flex items-center gap-4 mb-10 px-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                   <Gamepad2 className="text-white" size={20} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-indigo-950 uppercase leading-none">Fun Activities</h2>
                   <p className="text-[10px] font-bold text-indigo-950/40 uppercase tracking-widest mt-1">Play and master together</p>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { id: 'sound', title: 'Sound Match', emoji: '🔊', color: 'bg-blue-500' },
                  { id: 'truefalse', title: 'True or False', emoji: '🤪', color: 'bg-emerald-500' },
                  { id: 'sequence', title: 'Sequence', emoji: '🧩', color: 'bg-purple-500' },
                  { id: 'memory', title: 'Memory', emoji: '🧠', color: 'bg-rose-500' },
                ].map((game) => (
                  <motion.button key={game.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onTap={() => setActiveGame(game.id)}
                    className="bg-white/40 backdrop-blur-3xl rounded-[3rem] p-8 text-left border-2 border-white/60 shadow-2xl flex items-center gap-8 transition-all group hover:bg-white/60"
                  >
                     <div className={`w-20 h-20 rounded-[1.8rem] ${game.color} flex items-center justify-center text-4xl shadow-xl transform group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                       {game.emoji}
                     </div>
                     <div>
                       <h3 className="text-2xl font-black text-indigo-950 tracking-tight leading-none mb-2">{game.title}</h3>
                       <span className="text-xs font-black text-indigo-900/40 uppercase tracking-[0.2em]">Start Training</span>
                     </div>
                     <ChevronRight className="ml-auto text-indigo-900/20 group-hover:text-indigo-900 group-hover:translate-x-2 transition-all" size={32} />
                  </motion.button>
                ))}
             </div>
          </div>

        </div>
      </div>
      )}

      {/* OVERLAY WRAPPERS */}
      <AnimatePresence>
        {activeQuiz && (
          <div className="fixed inset-0 z-[200] bg-white overflow-y-auto magic-scroll">
            <QuizEngine lesson={activeQuiz} onClose={() => setActiveQuiz(null)} onComplete={() => {}} />
          </div>
        )}
        {activeGame && (
          <div className="fixed inset-0 z-[200] bg-sky-400 overflow-y-auto magic-scroll">
            <div className="relative min-h-screen">
              {activeGame === 'sound' && <SoundMatchGame onBack={() => setActiveGame(null)} />}
              {activeGame === 'truefalse' && <TrueOrFalseGame onBack={() => setActiveGame(null)} />}
              {activeGame === 'sequence' && <SequenceGame onBack={() => setActiveGame(null)} />}
              {activeGame === 'memory' && <MemoryMatchGame onBack={() => setActiveGame(null)} />}
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
