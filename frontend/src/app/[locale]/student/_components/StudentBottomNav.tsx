'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Compass, Gamepad2, User, Sparkles } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';

const NAV_ITEMS = [
  { name: 'Home', icon: LayoutDashboard, path: '/student/Home', color: 'from-blue-400 to-indigo-500' },
  { name: 'Learn', icon: Compass, path: '/student/Learn', color: 'from-orange-400 to-rose-500' },
  { name: 'Games', icon: Gamepad2, path: '/student/Quiz', color: 'from-emerald-400 to-teal-500' },
  { name: 'Profile', icon: User, path: '/student/profile', color: 'from-purple-400 to-fuchsia-500' },
];

export default function StudentBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] pointer-events-none flex justify-center">
      <motion.nav
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="pointer-events-auto"
      >
        <div className="bg-white/95 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex items-center gap-1.5 border-t border-x border-slate-100 px-4 pt-3 pb-5 rounded-t-[2.5rem] backdrop-blur-2xl">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.toLowerCase().includes(item.path.toLowerCase());

            return (
              <Link key={item.name} href={item.path} className="relative group">
                <motion.div
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-[1.8rem] transition-all duration-300 ${isActive ? `bg-gradient-to-r ${item.color} shadow-lg shadow-indigo-200` : 'hover:bg-slate-50'
                    }`}
                >
                  <div className={`relative flex items-center justify-center ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-800'}`}>
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>

                  {(isActive || false) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: isActive ? 1 : 0, width: isActive ? 'auto' : 0 }}
                      className={`text-[12px] font-black uppercase tracking-widest text-white whitespace-nowrap overflow-hidden ${isActive ? 'ml-1' : ''}`}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
