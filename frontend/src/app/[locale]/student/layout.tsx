'use client';

import React, { useEffect } from 'react';
import { usePathname } from '@/i18n/routing';
import StudentBottomNav from './_components/StudentBottomNav';
import { audioEngine } from '@/core/utils/audio';
import { queryClientSingleton } from '@/providers/QueryProvider';
import { studentKeys, studentApi } from '@/core/services/studentApi';

async function refreshStudentActivity() {
  try {
    await fetch('/api/student/me', {
      credentials: 'include',
      cache: 'no-store',
    });
  } catch {
    // Keep the heartbeat best-effort only; no UI impact.
  }
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Force absolute scroll reset on any internal navigation
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Prime the audio engine for the session
    audioEngine?.warmUp();
  }, [pathname]);

  useEffect(() => {
    refreshStudentActivity();

    // ── Eager prefetch: student lessons (subjects + chapters + lessons) ──
    queryClientSingleton.prefetchQuery({
      queryKey: studentKeys.lessons,
      queryFn: studentApi.getLessons,
      staleTime: 60 * 1000,
    });
    queryClientSingleton.prefetchQuery({
      queryKey: studentKeys.dashboard,
      queryFn: studentApi.getDashboard,
      staleTime: 60 * 1000,
    });

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        refreshStudentActivity();
      }
    };

    const intervalId = window.setInterval(refreshStudentActivity, 2 * 60 * 1000);
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      
      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 w-full transition-opacity duration-300">
        {children}
        <div className="h-24 sm:h-32" />
      </main>

      {/* ── NAVIGATION ── */}
      <StudentBottomNav />

    </div>
  );
}

