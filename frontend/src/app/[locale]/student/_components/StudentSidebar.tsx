'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Compass, Play, Trophy, User, Settings, 
  HelpCircle, LogOut, LayoutDashboard,
  Gamepad2, BookOpen, Star
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/student/Home' },
  { name: 'Adventure', icon: Compass, path: '/student/Learn' },
  { name: 'Quiz Arena', icon: Gamepad2, path: '/student/Quiz' },
  { name: 'Collections', icon: BookOpen, path: '/student/Collections' },
  { name: 'Achievements', icon: Trophy, path: '/student/Achievements' },
];

export default function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-slate-950 text-white p-6 z-[70] hidden xl:flex flex-col border-r border-white/5 shadow-2xl">
      
      {/* ── LOGO SECTION ── */}
      <div className="flex items-center gap-4 mb-12 px-2">
         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-white/10">
            <Star className="text-white fill-white" size={24} />
         </div>
         <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter leading-none">AI PORTAL</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-1">Student Elite</span>
         </div>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 space-y-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-4">Main Menu</p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className="relative group block"
            >
              <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-white/10 text-white border border-white/10' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}>
                <item.icon size={20} className={isActive ? 'text-indigo-400' : 'group-hover:text-indigo-300'} />
                <span className="text-sm font-black tracking-tight">{item.name}</span>
                
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-[-24px] w-2 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="mt-auto pt-8 border-t border-white/5 space-y-2">
         <Link href="/student/Profile" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <User size={20} />
            <span className="text-sm font-black tracking-tight">Profile Settings</span>
         </Link>
         <button className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all">
            <LogOut size={20} />
            <span className="text-sm font-black tracking-tight">Logout</span>
         </button>
      </div>

    </aside>
  );
}
