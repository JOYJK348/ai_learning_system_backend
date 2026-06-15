'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Star, Trophy, Award, Sparkles, Crown,
  Cloud, Flame, MapPin, Heart, Zap,
  BookOpen, Music, Palette, Dog,
  ChevronRight, Play, Lock, Unlock,
  User, Calendar, Settings, Edit3, Globe,
  Bell, CreditCard, Brain, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

/* ═══════════════════════════════════════════
   AVATAR CHARACTERS & DATA
   ═══════════════════════════════════════════ */
const AVATARS = [
  { id: 'owl', name: 'Wise Owl', src: '/assets/avatars/owl.png' },
];

const TROPHIES = [
  { id: 't1', title: 'Forest Master', zone: 'Alphabet Forest', emoji: '🦉', color: 'from-indigo-400 to-purple-500', earned: true },
  { id: 't2', title: 'Number Ninja', zone: 'Number Mountain', emoji: '⚡', color: 'from-blue-400 to-cyan-500', earned: true },
  { id: 't3', title: 'Jungle King', zone: 'Animal Jungle', emoji: '🦁', color: 'from-amber-400 to-orange-500', earned: false },
  { id: 't4', title: 'Color Wizard', zone: 'Color Garden', emoji: '🎨', color: 'from-emerald-400 to-teal-500', earned: false },
  { id: 't5', title: 'Sound Star', zone: 'Sound Lab', emoji: '🎵', color: 'from-rose-400 to-pink-500', earned: true },
  { id: 't6', title: 'Quiz Champion', zone: 'Quiz Arena', emoji: '🏆', color: 'from-yellow-400 to-amber-500', earned: false },
];

function getExplorerTitle(categories: Array<{ progress: number }>): string {
  const avgProgress = categories.reduce((sum, c) => sum + (c.progress || 0), 0) / categories.length;
  if (avgProgress >= 80) return '🌟 Master Explorer';
  if (avgProgress >= 50) return '⚡ Super Adventurer';
  if (avgProgress >= 25) return '🧭 Brave Explorer';
  return '🌱 Rising Star';
}

/* ═══════════════════════════════════════════
   MAIN: MY WORLD PROFILE PAGE 🌍
   ═══════════════════════════════════════════ */
export default function MyWorldProfile() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'en';
  const [mounted, setMounted] = useState(false);
  const [isParentMode, setIsParentMode] = useState(false);
  const { logout } = useAuth();
  const { subjects, studentProfile } = useData();
  
  useEffect(() => { setMounted(true); }, []);
  
  const profileCategories = subjects.map((s, idx) => ({
    id: s.id,
    title: s.name,
    icon: [BookOpen, Palette, Dog, Music][idx % 4],
    color: ['bg-rose-100 text-rose-500', 'bg-blue-100 text-blue-500', 'bg-emerald-100 text-emerald-500', 'bg-amber-100 text-amber-500'][idx % 4],
    border: ['border-rose-200', 'border-blue-200', 'border-emerald-200', 'border-amber-200'][idx % 4],
    progress: s.chapters.length > 0 ? Math.round(s.chapters.filter(c => c.completion_percentage >= 100).length / s.chapters.length * 100) : 0,
    lessons: s.chapters.flatMap(c => c.lessons).length,
  }));

  const explorerTitle = profileCategories.length > 0 ? getExplorerTitle(profileCategories as any) : '🌱 Rising Star';
  const totalTrophies = TROPHIES.filter(t => t.earned).length;
  const totalZones = profileCategories.length;
  const wordsDiscovered = 47;
  const daysActive = 18;



  return (
    <div className="relative font-sans bg-sky-400 overflow-x-hidden">
      
      {/* ─── GLOBAL MAGICAL SKY ATMOSPHERE ─── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-sky-400 to-blue-500" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)' , backgroundSize: '40px 40px' }} />
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-blue-300/30 blur-[100px] rounded-full" />
      </div>

      {/* ─── PARENT MODE & SIGN OUT TOGGLE ─── */}
      <div className="relative z-50 flex justify-end items-center gap-3 px-6 pt-6 mb-4 max-w-7xl mx-auto w-full">
          <button 
           onClick={async () => { await logout(); router.push(`/${locale}/login`); }}
           className="px-5 py-3 rounded-full bg-white/20 hover:bg-white backdrop-blur-xl text-white hover:text-rose-600 font-black text-xs uppercase tracking-widest border-2 border-white/40 hover:border-white shadow-xl flex items-center gap-2 transition-all duration-300"
          >
            <LogOut size={16} /> 
            Sign Out
         </button>

         <button 
           onClick={() => setIsParentMode(!isParentMode)} 
           className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest border-2 shadow-xl flex items-center gap-2 transition-all duration-500 ${isParentMode ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700' : 'bg-white/80 backdrop-blur-xl text-indigo-950 border-white hover:bg-white'}`}
         >
            {isParentMode ? <Unlock size={16} /> : <Lock size={16} />} 
            {isParentMode ? 'Kid View' : 'Parent Access'}
         </button>
      </div>

      {!isParentMode ? (
        /* ═══════════════════════════════════════
           STUDENT VIEW (MY WORLD)
           ═══════════════════════════════════════ */
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6">

          {/* 1. HERO (SEAMLESS) */}
          <div className="relative w-full py-10 mb-12 text-center flex flex-col md:flex-row items-center justify-between gap-10 border-b-8 border-white/10">
              <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-white/30 to-transparent skew-x-[-20deg] transform translate-x-32" />
              
              {/* Left Box: Avatar & Title */}
              <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
                 <motion.div 
                   initial={{ scale: 0 }} 
                   animate={{ scale: 1 }} 
                   transition={{ type: "spring", stiffness: 200, damping: 15 }}
                   className="w-40 h-40 rounded-full border-4 border-white shadow-xl mb-6 flex items-center justify-center relative overflow-hidden bg-indigo-50"
                 >
                    <img src="/assets/avatars/agnika_avatar.png" alt="Agnika Avatar" className="w-full h-full object-cover" />
                    <div className="absolute -bottom-2 -right-2 bg-amber-400 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-lg z-10 hidden">
                      {/* Note: Kept the DOM structure, but hidden original star if needed or leave star over it */}
                    </div>
                    <div className="absolute bottom-0 right-2 bg-amber-400 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-lg z-10">
                      <span className="text-2xl">⭐</span>
                    </div>
                 </motion.div>

                 <h1 className="text-5xl sm:text-7xl font-black text-indigo-950 mb-4 tracking-tighter">{studentProfile?.name || 'Explorer'}'s World</h1>
                 
                 <div className="inline-flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-full text-sm font-black uppercase tracking-[0.3em] shadow-xl">
                    <Flame size={20} fill="currentColor" className="text-amber-400" /> {explorerTitle}
                 </div>
              </div>

              {/* Right Box: Stats Grid Stretched */}
              <div className="relative z-10 w-full md:w-3/5">
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full">
                    {[
                      { val: `${daysActive}`, label: 'Days Streak', icon: '🔥', color: 'text-rose-500' },
                      { val: `${totalTrophies}`, label: 'Trophies Won', icon: '🏆', color: 'text-amber-500' },
                      { val: `${wordsDiscovered}`, label: 'Words Found', icon: '📚', color: 'text-indigo-600' },
                    ].map((s, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border-2 border-white/80 shadow-lg flex flex-col items-center justify-center"
                      >
                        <span className="text-4xl mb-3 block select-none drop-shadow-sm">{s.icon}</span>
                        <span className={`text-4xl sm:text-5xl font-black ${s.color} block tracking-tighter`}>{s.val}</span>
                        <span className="text-[10px] font-black text-indigo-950/50 uppercase tracking-[0.2em] mt-2 block text-center leading-tight">{s.label}</span>
                      </motion.div>
                    ))}
                 </div>
              </div>
          </div>

          {/* 2. TROPHY SHELF (GLASSMORPHIC) */}
          <div className="mb-12">
             <h2 className="text-xl font-black text-indigo-950 tracking-tight mb-6 px-2 flex items-center gap-3">
               <Trophy className="text-amber-400" size={24} /> Trophy Room
             </h2>
             <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 px-2 magic-scroll">
                {TROPHIES.map((trophy) => (
                  <motion.div 
                    key={trophy.id} 
                    whileHover={{ y: -5 }}
                    className={`flex-shrink-0 w-40 rounded-[2.5rem] p-5 text-center border-2 shadow-xl transition-all ${
                      trophy.earned 
                        ? 'bg-amber-400/20 backdrop-blur-xl border-amber-300' 
                        : 'bg-white/20 backdrop-blur-xl border-white/30 opacity-60 grayscale'
                    }`}
                  >
                     <div className={`w-16 h-16 rounded-[1.5rem] mx-auto flex items-center justify-center text-4xl mb-4 border-4 shadow-inner ${
                       trophy.earned ? `bg-gradient-to-br ${trophy.color} border-white/60` : 'bg-slate-300 border-white/20'
                     }`}>
                        {trophy.emoji}
                     </div>
                     <h3 className={`text-xs font-black uppercase tracking-wider ${trophy.earned ? 'text-indigo-950' : 'text-indigo-950/40'}`}>
                        {trophy.title}
                     </h3>
                  </motion.div>
                ))}
             </div>
          </div>

          {/* 3. ZONE PROGRESS (GLASSMORPHIC BUBBLES) */}
          <div className="mb-12">
             <h2 className="text-xl font-black text-indigo-950 tracking-tight mb-6 px-2 flex items-center gap-3">
               <MapPin className="text-emerald-400" size={24} /> Kingdom Mastery
             </h2>
             <div className="bg-white/50 backdrop-blur-3xl rounded-[3.5rem] p-8 sm:p-12 border-2 border-white/60 shadow-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 overflow-visible">
                   {profileCategories.map((cat, i) => (
                     <motion.div 
                       key={cat.id} 
                       initial={{ opacity: 1, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.1 }}
                       whileHover={{ scale: 1.05 }}
                       className="flex flex-col items-center"
                     >
                         <div className={`relative w-24 h-24 rounded-[2rem] border-4 flex items-center justify-center text-3xl font-black shadow-xl mb-4 transition-all ${
                           i === 0 ? 'bg-rose-400/20 border-rose-400 text-rose-600' :
                           i === 1 ? 'bg-blue-400/20 border-blue-400 text-blue-600' :
                           i === 2 ? 'bg-emerald-400/20 border-emerald-400 text-emerald-600' :
                           'bg-amber-400/20 border-amber-400 text-amber-600'
                         }`}>
                           {cat.progress}%
                           <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-md">
                             <cat.icon size={14} className="text-indigo-950" />
                           </div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-950/60 uppercase tracking-widest text-center">
                          {cat.title}
                        </span>
                     </motion.div>
                   ))}
                </div>
             </div>
          </div>

        </div>
      ) : (
        /* ═══════════════════════════════════════
           PARENT VIEW (DASHBOARD & INSIGHTS)
           ═══════════════════════════════════════ */
        <motion.div 
          initial={{ opacity: 1, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6"
        >
           {/* 1. CHILD BASICS (Personal Details) */}
           <div className="bg-white/40 backdrop-blur-3xl rounded-[3.5rem] p-8 sm:p-14 border-2 border-white/60 shadow-2xl mb-12 flex flex-col md:flex-row items-center gap-10">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-indigo-200 shadow-xl flex items-center justify-center flex-shrink-0 bg-indigo-50 overflow-hidden">
                 <img src="/assets/avatars/agnika_avatar.png" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-center md:text-left">
                  <h2 className="text-4xl sm:text-6xl font-black text-indigo-950 tracking-tighter mb-4">{studentProfile?.name || 'Explorer'}</h2>
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 text-xs sm:text-sm font-black text-indigo-900/60 uppercase tracking-widest">
                     <span className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-full border border-white"><User size={16} className="text-indigo-500"/> {studentProfile?.grade_name || 'LKG'}</span>
                     <span className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-full border border-white"><Award size={16} className="text-indigo-500"/> Explorer</span>
                     <span className="flex items-center gap-2 bg-white/40 px-4 py-2 rounded-full border border-white"><Calendar size={16} className="text-indigo-500"/> Joined 2026</span>
                 </div>
              </div>
              <button className="bg-white/60 p-5 rounded-[2rem] hover:bg-white hover:scale-105 transition-all shadow-lg border-2 border-white max-w-max mx-auto md:ml-auto md:mx-0">
                <Edit3 className="text-indigo-950" size={24}/>
              </button>
           </div>

           {/* 2. ADVENTURE LOG & INSIGHTS */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-amber-400/20 backdrop-blur-3xl rounded-[3.5rem] p-10 sm:p-14 border-2 border-amber-300 shadow-xl flex flex-col justify-center">
                 <h3 className="text-2xl sm:text-3xl font-black text-amber-950 mb-6 flex items-center gap-3">
                   <BookOpen className="text-amber-600" size={32} /> Adventure Log
                 </h3>
                 <p className="text-lg sm:text-xl font-medium text-amber-900/80 leading-relaxed">
                    {studentProfile?.name || 'This explorer'} has been on an amazing journey! Explored <strong className="font-black text-amber-950">4 magical zones</strong>, discovered <strong className="font-black text-amber-950">47 new words</strong>, completed <strong className="font-black text-amber-950">23 levels</strong>, and spent <strong className="font-black text-amber-950">3.5 hours</strong> learning and playing this month.
                 </p>
              </div>
              
              <div className="bg-purple-400/20 backdrop-blur-3xl rounded-[3.5rem] p-10 sm:p-14 border-2 border-purple-300 shadow-xl flex flex-col justify-center">
                 <h3 className="text-2xl sm:text-3xl font-black text-purple-950 mb-6 flex items-center gap-3">
                   <Brain className="text-purple-600" size={32} /> Growth Insight
                 </h3>
                 <p className="text-lg sm:text-xl font-medium text-purple-900/80 leading-relaxed">
                    {studentProfile?.name || 'They'} spends most time in the <strong className="font-black text-purple-950">Sound Lab</strong>. Responds exceptionally well to <em className="not-italic font-black text-purple-950 px-2 py-1 bg-purple-300/30 rounded-lg">audio-based learning</em>. 
                 </p>
                 <div className="mt-8 bg-white/60 backdrop-blur-md border border-white rounded-[2rem] p-6 flex items-start gap-4">
                    <span className="text-3xl">💡</span>
                    <p className="text-sm font-black text-indigo-950 uppercase tracking-widest leading-relaxed">
                      Suggestion: Try <span className="text-emerald-600">Bird Sky zone</span> next to build on phonetic strengths.
                    </p>
                 </div>
              </div>
           </div>

           {/* 3. WEEKLY SUMMARY */}
           <div className="bg-emerald-400/20 backdrop-blur-3xl rounded-[3.5rem] p-10 sm:p-14 border-2 border-emerald-300 shadow-xl mb-12 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-10">
              <div>
                 <h3 className="text-3xl font-black text-emerald-950 mb-3 tracking-tighter">This Week's Highlights</h3>
                 <p className="text-emerald-900/70 font-black uppercase tracking-widest text-sm">A quick glance at recent activity.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                 <div className="bg-white/60 p-6 rounded-[2rem] border-2 border-white shadow-lg text-center min-w-[120px]">
                    <span className="block text-4xl mb-2 font-black text-emerald-950">5</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-900/60">Days Active</span>
                 </div>
                 <div className="bg-white/60 p-6 rounded-[2rem] border-2 border-white shadow-lg text-center min-w-[120px]">
                    <span className="block text-4xl mb-2 font-black text-emerald-950">8</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-900/60">Levels Won</span>
                 </div>
                 <div className="bg-white/60 p-6 rounded-[2rem] border-2 border-white shadow-lg text-center min-w-[120px]">
                    <span className="block text-4xl mb-2 drop-shadow-sm">🐯</span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-900/60">Jungle Fan</span>
                 </div>
              </div>
           </div>

           {/* 4. ACCOUNT SETTINGS */}
           <div className="bg-white/40 backdrop-blur-3xl rounded-[3.5rem] p-10 border-2 border-white/60 shadow-2xl">
              <h3 className="text-2xl font-black text-indigo-950 mb-8 flex items-center gap-3">
                <Settings className="text-indigo-600" size={28} /> Account Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                 {[
                   { label: 'Edit Child Profile', icon: User, color: 'text-blue-600', bg: 'bg-blue-100' },
                   { label: 'Language: English', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                   { label: 'Push Notifications', icon: Bell, color: 'text-amber-600', bg: 'bg-amber-100' },
                   { label: 'Subscription (Pro)', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100' },
                 ].map((opt, i) => (
                   <button key={i} className="flex items-center gap-6 bg-white/60 p-6 rounded-[2.5rem] border-2 border-white/80 shadow-md hover:bg-white hover:scale-[1.02] active:scale-95 transition-all text-left">
                      <div className={`${opt.bg} p-4 rounded-2xl ${opt.color} shadow-inner`}>
                         <opt.icon size={28}/>
                      </div>
                      <span className="font-black text-indigo-950 uppercase text-xs sm:text-sm tracking-widest">{opt.label}</span>
                      <ChevronRight className="ml-auto text-indigo-900/30" size={24} />
                   </button>
                 ))}
              </div>
           </div>
        </motion.div>
      )}

    </div>
  );

}

