'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Bell, Play, Trophy, Award, Star, User, Award as AwardIcon, LogOut, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

interface StudentNavbarProps {
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  showProfile: boolean;
  setShowProfile: (show: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (show: boolean) => void;
}

export default function StudentNavbar({
  showNotifications,
  setShowNotifications,
  showProfile,
  setShowProfile,
}: StudentNavbarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { studentProfile } = useData();
  const studentName = user?.name || studentProfile?.name || 'Explorer';
  const studentGrade = studentProfile?.grade_name || 'LKG';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm px-4 sm:px-6">
      <div className="max-w-7xl mx-auto h-20 flex items-center justify-between gap-4">
        
        {/* Logo Section */}
        <div className="flex items-center gap-6">
          <Link href="/student/home" className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-[#013237] text-white flex items-center justify-center font-bold text-lg shadow-md">
              Z<span className="text-[#D4AF37]">A</span>
            </div>
            <span className="hidden lg:block font-extrabold text-xl tracking-tight text-[#013237]">
              ZHI <span className="text-[#D4AF37]">LearnAI</span>
            </span>
          </Link>
        </div>
          
        {/* Navigation Links (Always Visible) */}
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl order-2 sm:order-none font-sans">
          {[
            { name: 'Home', icon: Globe, path: '/student/home' },
            { name: 'Learn', icon: Play, path: '/student/learn' },
            { name: 'Quiz', icon: Trophy, path: '/student/quiz' }
          ].map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-[10px] sm:text-sm font-black transition-all ${
                  isActive 
                    ? 'bg-white text-[#013237] shadow-sm scale-105' 
                    : 'text-slate-500 hover:text-[#013237] hover:bg-white/50'
                }`}
              >
                <item.icon size={15} className={`sm:w-4 sm:h-4 ${isActive ? 'text-[#013237]' : ''}`} strokeWidth={3} />
                <span className={item.name === 'Home' ? 'block' : 'hidden xs:block'}>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-1 sm:gap-4 order-3">
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className={`p-1.5 sm:p-2 transition-colors rounded-full relative ${showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Bell size={18} className="sm:w-5 sm:h-5" />
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 origin-top-right overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Notifications</h4>
                    <span className="text-[10px] bg-[#013237] text-white px-2 py-0.5 rounded-full font-bold uppercase">2 New</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3 text-sm p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><AwardIcon size={20} /></div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight italic">New lesson added!</p>
                        <p className="text-[11px] text-slate-500 mt-1 uppercase font-black">Numbers 1 to 50 </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative ml-1">
             <button 
               onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
               className={`flex items-center gap-2 p-1 pr-1.5 sm:pr-3 rounded-full transition-all border ${showProfile ? 'border-[#013237]/20 bg-slate-50' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'}`}
             >
               <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 border-2 border-white shadow-sm overflow-hidden shrink-0">
                  <Image src="/assets/avatars/agnika_avatar.png" alt="Avatar" width={36} height={36} className="object-cover" />
               </div>
               <div className="hidden xs:block text-left">
                  <p className="text-[10px] sm:text-[11px] font-black text-[#013237] leading-tight uppercase tracking-tight">{studentName}</p>
               </div>
             </button>

             <AnimatePresence>
              {showProfile && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-50 origin-top-right overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center p-5 bg-gradient-to-b from-slate-50 to-white rounded-[1.5rem] mb-4 border border-slate-100/50">
                    <div className="w-20 h-20 rounded-full border-[6px] border-white shadow-xl overflow-hidden mb-3 ring-1 ring-slate-100">
                       <Image src="/assets/avatars/agnika_avatar.png" alt="Avatar" width={80} height={80} className="object-cover" />
                    </div>
                    <h4 className="font-black text-[#013237] text-xl">{studentName}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{studentGrade} Explorer</p>
                  </div>

                  <div className="space-y-1 px-1">
                    <Link 
                      href="/student/home"
                      onClick={() => setShowProfile(false)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-slate-700 font-black transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><Globe size={16} /></div>
                        <span className="text-sm">Home Panel</span>
                      </div>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 translate-x-1 transition-all text-slate-300" />
                    </Link>
                    <Link 
                      href="/student/learn"
                      onClick={() => setShowProfile(false)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-slate-700 font-black transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><Play size={16} /></div>
                        <span className="text-sm">Learn Lessons</span>
                      </div>
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 translate-x-1 transition-all text-slate-300" />
                    </Link>
                    <Link 
                        href="/student/quiz"
                        onClick={() => setShowProfile(false)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-slate-700 font-black transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center"><Trophy size={16} /></div>
                          <span className="text-sm">Quiz Activities</span>
                        </div>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 translate-x-1 transition-all text-slate-300" />
                    </Link>

                    <div className="my-2 border-t border-slate-50" />

                    <Link 
                        href="/student/profile"
                        onClick={() => setShowProfile(false)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 text-slate-700 font-black transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><User size={16} /></div>
                          <span className="text-sm">Student Profile</span>
                        </div>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 translate-x-1 transition-all text-slate-300" />
                    </Link>
                    
                    <Link href="/" className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-rose-50 text-rose-500 font-black transition-all mt-3 bg-rose-50/30">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center"><LogOut size={16} /></div>
                        <span className="text-sm italic">Logout Session</span>
                    </Link>
                  </div>
                </motion.div>
              )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
