'use client';

import React from 'react';
import { Trophy } from 'lucide-react';

export default function QuizSection() {
  return (
    <div id="quiz" className="mt-10 bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-100 shadow-sm col-span-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center">
            <Trophy size={20} />
        </div>
        <h3 className="text-lg font-extrabold text-slate-800">Your Learning Journey</h3>
      </div>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm font-bold text-slate-600 mb-2">
            <span>Weekly Goal Progress</span>
            <span className="text-[#013237] bg-emerald-50 px-2 py-0.5 rounded-lg">75% Done</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 shadow-inner p-0.5">
            <div className="bg-gradient-to-r from-[#013237] to-[#00D2FF] h-full rounded-full transition-all duration-1000" style={{ width: '75%' }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time Spent</p>
                <p className="text-xl font-black text-slate-700">2h 45m</p>
            </div>
            <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-100`}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Correct Answers</p>
                <p className="text-xl font-black text-slate-700">124</p>
            </div>
        </div>
      </div>
    </div>
  );
}
