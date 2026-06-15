'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, studentKeys, type Activity } from '@/core/services/studentApi';
import { AnimatePresence, motion } from 'framer-motion';
import VideoSnake from './VideoSnake';
import VideoCircle from './VideoCircle';
import TraceActivity from './TraceActivity';
import DrawCanvas from './DrawCanvas';
import LetterShowcase from './LetterShowcase';
import LetterFindGame from './LetterFindGame';
import BalloonPop from './BalloonPop';
import MemoryMatch from './MemoryMatch';
import NameTraceActivity from './NameTraceActivity';
import { useData } from '@/context/DataContext';

type Props = {
  lessonId: string;
  lessonTitle: string;
  onComplete: () => void;
  onClose: () => void;
};

const ACTIVITY_TYPE_MAP: Record<number, string> = {
  5: 'video',
  1: 'trace',  // legacy tracing type
  6: 'trace',
  7: 'draw',
  3: 'match',
  4: 'quiz',
  8: 'name',
};

export default function ActivityPlayer({ lessonId, lessonTitle, onComplete, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: activities, isLoading, isError } = useQuery({
    queryKey: studentKeys.activities(lessonId),
    queryFn: () => studentApi.getLessonActivities(lessonId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const submitMutation = useMutation({
    mutationFn: ({ activityId, body }: { activityId: string; body: Parameters<typeof studentApi.submitActivityAttempt>[2] }) =>
      studentApi.submitActivityAttempt(lessonId, activityId, body),
  });

  const progressMutation = useMutation({
    mutationFn: () => studentApi.updateProgress(lessonId, { status: 'completed', completion_percentage: 100 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.activities(lessonId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lessons });
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard });
    },
  });

  const handleActivityComplete = useCallback((activityId: string, data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) => {
    // Advance immediately without waiting for API
    const newCompleted = new Set(completedIds);
    newCompleted.add(activityId);
    setCompletedIds(newCompleted);

    if (activities && currentIndex < activities.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (activities && newCompleted.size >= activities.length) {
      progressMutation.mutate(undefined, {
        onSuccess: () => setTimeout(onComplete, 500),
        onError: () => setTimeout(onComplete, 500),
      });
    }

    // Submit attempt in background (fire-and-forget, don't block UI)
    submitMutation.mutate({ activityId, body: data });
  }, [submitMutation, completedIds, currentIndex, activities, progressMutation, onComplete]);

  const currentActivity: Activity | undefined = activities?.[currentIndex];
  const allDone = completedIds.size > 0 && activities && completedIds.size >= activities.length;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-[3px] border-white/20 border-t-white/80"
          />
          <p className="text-white/60 font-bold text-sm">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (isError || !activities || activities.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}>
        <div className="rounded-[2rem] p-8 max-w-lg w-full mx-4 shadow-2xl text-center border border-white/30 backdrop-blur-md"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <p className="text-lg font-black text-white">No activities for this lesson yet.</p>
          <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-200 rounded-full font-bold">
            Back
          </button>
        </div>
      </div>
    );
  }

  const renderActivity = () => {
    const act = currentActivity!;
    const type = ACTIVITY_TYPE_MAP[act.activity_type_id] || 'unknown';
    const commonProps = {
      onComplete: (data: { score: number; max_score: number; completion_data: Record<string, unknown>; time_taken_seconds: number }) =>
        handleActivityComplete(act.id, data),
    };

    switch (type) {
      case 'video':
        if (act.config?.letter) return <LetterShowcase config={act.config} {...commonProps} />;
        return act.name.toLowerCase().includes('circle')
          ? <VideoCircle {...commonProps} />
          : <VideoSnake {...commonProps} />;
      case 'trace':
        return <TraceActivity config={act.config} hasAttempt={!!act.attempt} {...commonProps} />;
      case 'draw':
        return <DrawCanvas config={act.config} {...commonProps} />;
      case 'match':
        return <MemoryMatch config={act.config} {...commonProps} />;
      case 'quiz':
        return <LetterFindGame config={act.config} {...commonProps} />;
      case 'name':
        return <NameTraceActivity config={act.config} studentName={act.config?.name as string} {...commonProps} />;
      default:
        return (
          <div className="flex flex-col items-center gap-4 p-8">
            <p className="text-lg font-bold">Coming soon!</p>
            <button
              onClick={() => handleActivityComplete(act.id, { score: 100, max_score: 100, completion_data: { skipped: true }, time_taken_seconds: 0 })}
              className="px-6 py-2 bg-indigo-500 text-white rounded-full font-bold"
            >
              Skip
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="relative w-full max-w-lg sm:max-w-2xl mx-2 sm:mx-4 my-2 sm:my-4 overflow-hidden rounded-2xl sm:rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.2)]"
        style={{ background: 'linear-gradient(145deg, #7dd3fc, #38bdf8, #3b82f6)' }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '18px 18px' }} />
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-white/20 to-transparent skew-x-[-20deg] translate-x-32 pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-white/15 blur-[60px] sm:blur-[100px] rounded-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-3 sm:px-5 pt-3 sm:pt-5 pb-2 sm:pb-3">
          <span className="text-[10px] sm:text-sm font-bold text-white/60">
            {currentIndex + 1} / {activities.length}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {activities.map((a, i) => (
              <div key={a.id}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all shadow-md
                  ${completedIds.has(a.id) ? 'bg-green-400 text-white' : i === currentIndex ? 'bg-white/30 text-white border-2 border-white/60' : 'bg-white/15 text-white/50'}`}
              >
                {completedIds.has(a.id) ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <button onClick={onClose}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white/60 hover:text-white text-base sm:text-lg font-bold transition-all">
            &times;
          </button>
        </div>

        {/* Activity body */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentActivity?.id || 'done'}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              {allDone ? (
                <div className="flex flex-col items-center gap-4 sm:gap-6 px-6 sm:px-10 pb-6 sm:pb-10 pt-2">
                  <span className="text-5xl sm:text-7xl">🎉</span>
                  <h2 className="text-xl sm:text-3xl font-black text-white drop-shadow-lg text-center">{lessonTitle}</h2>
                  <p className="text-sm sm:text-lg font-bold text-green-200">Lesson Complete!</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onComplete}
                    className="px-6 sm:px-10 py-2.5 sm:py-4 bg-white/25 backdrop-blur-md text-white font-black text-sm sm:text-lg rounded-full shadow-xl border-2 border-white/40 hover:bg-white/35 transition-all"
                  >
                    Back to Lessons
                  </motion.button>
                </div>
              ) : currentActivity ? (
                renderActivity()
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
