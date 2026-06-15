const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `Failed to load ${path}`);
  return payload.data ?? payload;
}

export type LessonProgress = {
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  time_spent_seconds?: number;
  last_accessed_at?: string;
};

export type Lesson = {
  id: string;
  title: string;
  description?: string;
  youtube_video_id?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number;
  sort_order: number;
  is_unlocked: boolean;
  progress: LessonProgress;
};

export type Chapter = {
  id: string;
  name: string;
  sort_order: number;
  is_unlocked: boolean;
  completion_percentage: number;
  total_lessons: number;
  completed_lessons: number;
  lessons: Lesson[];
};

export type Subject = {
  id: string;
  name: string;
  chapters: Chapter[];
};

export type StudentProfile = {
  id: string;
  name: string;
  email?: string;
  grade_name?: string;
  school_name?: string;
  photo_url?: string;
  overall_progress: number;
  total_stars_earned: number;
  total_badges_earned: number;
  current_streak_days: number;
  total_lessons_completed: number;
  total_quizzes_attempted: number;
  total_quizzes_passed: number;
};

export type StudentDashboard = {
  student: {
    id: string;
    name: string;
    overall_progress: number;
    total_stars: number;
    total_badges: number;
    current_streak_days: number;
  };
  lesson_stats: {
    total_lessons: number;
    completed_lessons: number;
    in_progress_lessons: number;
    total_time_spent_seconds: number;
  };
  today_activity: {
    lessons_completed: number;
    lessons_accessed: number;
  };
  recent_badges: Array<{ name: string; image_url: string | null; earned_at: string }>;
  subject_progress: Array<{ subject_name: string; completed: number; total: number; percentage: number }>;
};

export type ActivityAttempt = {
  id: string;
  activity_id: string;
  score: number;
  max_score: number;
  completion_data: Record<string, unknown>;
  time_taken_seconds: number;
  completed_at: string;
  created_at: string;
};

export type Activity = {
  id: string;
  name: string;
  activity_type_id: number;
  config: Record<string, unknown>;
  sort_order: number;
  attempt: ActivityAttempt | null;
};

export const studentKeys = {
  me: ['student', 'me'] as const,
  lessons: ['student', 'lessons'] as const,
  dashboard: ['student', 'dashboard'] as const,
  activities: (lessonId: string) => ['student', 'activities', lessonId] as const,
};

export const studentApi = {
  getMe: (): Promise<StudentProfile> =>
    fetchJson<StudentProfile>('/api/student/me'),

  getLessons: (): Promise<Subject[]> =>
    fetchJson<Subject[]>('/api/student/lessons'),

  getDashboard: (): Promise<StudentDashboard> =>
    fetchJson<StudentDashboard>('/api/student/dashboard'),

  updateProgress: (lessonId: string, body: { status?: string; completion_percentage?: number }) =>
    fetchJson(`/api/student/lessons/${lessonId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  getLessonActivities: (lessonId: string): Promise<Activity[]> =>
    fetchJson<Activity[]>(`/api/student/lessons/${lessonId}/activities`),

  submitActivityAttempt: (lessonId: string, activityId: string, body: {
    score?: number;
    max_score?: number;
    time_taken_seconds?: number;
    completion_data?: Record<string, unknown>;
  }) =>
    fetchJson(`/api/student/lessons/${lessonId}/activities/${activityId}/attempt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
};
