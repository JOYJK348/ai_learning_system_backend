'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface Category {
  id: string;
  title: string;
  lessons: number;
  progress: number;
  color: string;
  border: string;
  icon: any;
}

interface LearnSectionProps {
  categories: Category[];
  handleCategoryClick: (id: string) => void;
}

export default function LearnSection({ categories, handleCategoryClick }: LearnSectionProps) {
  return (
    <div id="learn" className="mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <Sparkles className="text-amber-500" /> Choose What to Learn
        </h2>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <motion.div
            whileHover={{ scale: 1.03, y: -5 }}
            whileTap={{ scale: 0.97 }}
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`bg-white rounded-[2rem] p-6 cursor-pointer border-2 ${cat.border} shadow-sm hover:shadow-xl transition-all relative overflow-hidden group`}
          >
             {/* Background decoration */}
             <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-20 transition-transform group-hover:scale-150 ${cat.color.split(' ')[0]}`} />
             
             <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 text-2xl ${cat.color} shadow-inner relative z-10`}>
                <cat.icon size={32} strokeWidth={2.5} />
             </div>
             
             <h3 className="text-xl font-extrabold text-slate-800 mb-1">{cat.title}</h3>
             <p className="text-sm font-bold text-slate-500 mb-5">{cat.lessons} fun lessons</p>
             
             {/* Progress Bar */}
             <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className={`h-full rounded-full transition-all duration-1000 ${cat.color.split(' ')[0].replace('-100', '-500')}`}
                 style={{ width: `${cat.progress}%` }}
               />
             </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
