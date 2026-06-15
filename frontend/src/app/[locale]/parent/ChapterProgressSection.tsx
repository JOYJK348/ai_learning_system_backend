'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, ChevronRight, Lock, Unlock } from 'lucide-react';
import { parentApi, type ChapterProgress } from '@/core/services/parentApi';

export default function ChapterProgressSection({ childId }: { childId?: string | null }) {
  const [data, setData] = useState<ChapterProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!childId) return;
    parentApi.childChapterProgress(childId)
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [childId]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-48" />
          <div className="h-4 bg-slate-100 rounded w-64" />
          <div className="h-20 bg-slate-50 rounded-xl" />
          <div className="h-20 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.subjects || data.subjects.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm text-center">
        <BookOpen size={40} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500 font-bold text-sm">No chapter progress data yet.</p>
        <p className="text-slate-400 text-xs mt-1">Start learning to see progress here.</p>
      </div>
    );
  }

  const totalChapters = data.subjects.reduce((sum, s) => sum + s.chapters.length, 0);
  const completedChapters = data.subjects.reduce((sum, s) => sum + s.chapters.filter(c => c.is_complete).length, 0);
  const overallPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-50 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BookOpen size={20} className="text-blue-600" />
              Chapter Progress
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
              {completedChapters} of {totalChapters} chapters completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-blue-600 tabular-nums">{overallPercentage}%</p>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mastery</p>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Subjects */}
      <div className="divide-y divide-slate-50">
        {data.subjects.map((subject) => {
          const subCompleted = subject.chapters.filter(c => c.is_complete).length;
          const subTotal = subject.chapters.length;
          const isExpanded = expandedSubject === subject.id;

          return (
            <div key={subject.id}>
              {/* Subject header */}
              <button
                onClick={() => setExpandedSubject(isExpanded ? null : subject.id)}
                className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-sm">
                    {subject.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{subject.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {subCompleted}/{subTotal} chapters
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-black text-slate-700 tabular-nums">
                    {subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0}%
                  </span>
                  <ChevronRight
                    size={16}
                    className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Chapter list */}
              {isExpanded && (
                <div className="px-8 pb-5 space-y-2">
                  {subject.chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between px-5 py-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-4">
                        {chapter.is_complete ? (
                          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        ) : chapter.completion_percentage > 0 ? (
                          <Unlock size={18} className="text-blue-400 shrink-0" />
                        ) : (
                          <Lock size={18} className="text-slate-300 shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-slate-700 text-[13px] leading-tight">
                            {chapter.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {chapter.completed_lessons}/{chapter.total_lessons} lessons
                            </span>
                            {chapter.total_time_spent_seconds > 0 && (
                              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock size={10} />
                                {Math.round(chapter.total_time_spent_seconds / 60)}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              chapter.is_complete ? 'bg-emerald-500' : 'bg-blue-400'
                            }`}
                            style={{ width: `${chapter.completion_percentage}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-black tabular-nums w-8 text-right ${
                          chapter.is_complete ? 'text-emerald-600' : 'text-slate-500'
                        }`}>
                          {chapter.completion_percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
