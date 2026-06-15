'use client';

import React from 'react';
import { Star, Flame, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[60] px-4 sm:px-8 py-4 pointer-events-none">
      <motion.div 
        initial={{ y: -20, opacity: 1 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto"
      >
        {/* ── LEFT: REWARD / LEVEL ── */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg"
        >
           <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
              <Star size={18} fill="currentColor" />
           </div>
           <div className="flex flex-col leading-none">
              <span className="text-sm font-black text-amber-600">Lvl 12</span>
              <span className="text-[9px] font-bold text-amber-400/70 uppercase tracking-widest whitespace-nowrap">Magic Explorer</span>
           </div>
        </motion.div>

        {/* ── RIGHT: STREAK & PROFILE ── */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Streak Indicator */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg"
          >
             <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                <Flame size={18} fill="currentColor" />
             </div>
             <div className="flex flex-col leading-none">
                <span className="text-sm font-black text-rose-600 uppercase tracking-tighter">5 Days</span>
                <span className="text-[9px] font-bold text-rose-400/70 uppercase tracking-widest whitespace-nowrap">Winning!</span>
             </div>
          </motion.div>

          {/* Minimal User Profile */}
          <div className="flex items-center gap-2 pl-2 sm:pl-4">
             <div className="relative group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white p-[2px] shadow-xl border border-white/40 group-hover:scale-105 transition-all">
                   <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 rounded-[14px] overflow-hidden">
                      <img 
                        src="/assets/avatars/agnika_avatar.png" 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                   </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
             </div>
             <ChevronDown className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors hidden sm:block" />
          </div>

        </div>
      </motion.div>
    </header>
  );
}
