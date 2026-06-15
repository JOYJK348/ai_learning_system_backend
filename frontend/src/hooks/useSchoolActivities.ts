'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export const schoolAdminKeys = {
  activities: (schoolId?: string | null) => ['school-admin', 'activities', schoolId] as const,
};

export type ActivityItem = {
  id: string;
  student_name: string;
  grade_name: string;
  section: string;
  type: 'lesson_complete' | 'quiz_pass' | 'quiz_fail';
  title: string;
  subject: string;
  score: number | null;
  max_score: number | null;
  created_at: string;
};

type GradeProgress = {
  grade_name: string;
  total_students: number;
  avg_completion: number;
  completed_lessons: number;
};

export type ActivitiesData = {
  server_time: string;
  stats: {
    total_students: number;
    active_today: number;
    total_lessons_completed: number;
    total_quizzes_taken: number;
    avg_completion_rate: number;
  };
  recent_activity: ActivityItem[];
  grade_progress: GradeProgress[];
};

export function usePrefetchSchoolActivities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  useEffect(() => {
    if (!schoolId) return;

    queryClient.prefetchQuery({
      queryKey: schoolAdminKeys.activities(schoolId),
      queryFn: async () => {
        const res = await fetch(`${API_BASE}/api/school-admin/activities`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch activities');
        const json = await res.json();
        return json.data as ActivitiesData;
      },
      staleTime: 60_000,
    });
  }, [schoolId, queryClient]);
}

export function useSchoolActivities() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  return useQuery({
    queryKey: schoolAdminKeys.activities(schoolId),
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/school-admin/activities`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch activities');
      const json = await res.json();
      return json.data as ActivitiesData;
    },
    enabled: !!schoolId,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
