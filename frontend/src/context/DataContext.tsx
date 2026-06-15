'use client';

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, studentKeys, type Subject, type StudentProfile, type StudentDashboard } from '@/core/services/studentApi';
import { useAuth } from './AuthContext';

type DataContextType = {
  studentProfile: StudentProfile | null;
  studentDashboard: StudentDashboard | null;
  subjects: Subject[];
  studentLoading: boolean;
  dashboardLoading: boolean;
  lessonsLoading: boolean;
  updateProgress: (lessonId: string, status: 'completed' | 'in_progress') => void;
  refetchLessons: () => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const queryClient = useQueryClient();

  const { data: studentProfile, isLoading: studentLoading } = useQuery({
    queryKey: studentKeys.me,
    queryFn: studentApi.getMe,
    enabled: isStudent,
    staleTime: 2 * 60 * 1000,
  });

  const { data: studentDashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: studentKeys.dashboard,
    queryFn: studentApi.getDashboard,
    enabled: isStudent,
    staleTime: 60 * 1000,
  });

  const { data: rawLessons, isLoading: lessonsLoading } = useQuery({
    queryKey: studentKeys.lessons,
    queryFn: studentApi.getLessons,
    enabled: isStudent,
    staleTime: 60 * 1000,
  });

  const subjects = useMemo(() => rawLessons ?? [], [rawLessons]);

  const progressMutation = useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: string }) =>
      studentApi.updateProgress(lessonId, { status, completion_percentage: status === 'completed' ? 100 : 50 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lessons });
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: studentKeys.me });
    },
  });

  const updateProgress = useCallback((lessonId: string, status: 'completed' | 'in_progress') => {
    progressMutation.mutate({ lessonId, status });
  }, [progressMutation]);

  const refetchLessons = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: studentKeys.lessons });
  }, [queryClient]);

  const value = useMemo(() => ({
    studentProfile: studentProfile ?? null,
    studentDashboard: studentDashboard ?? null,
    subjects,
    studentLoading,
    dashboardLoading,
    lessonsLoading,
    updateProgress,
    refetchLessons,
  }), [studentProfile, studentDashboard, subjects, studentLoading, dashboardLoading, lessonsLoading, updateProgress, refetchLessons]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}
