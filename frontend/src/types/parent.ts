export type ParentProfile = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  profile_photo_url: string | null;
  school: { id: string; name: string; code: string; city: string; state: string } | null;
  plan_type: string | null;
  plan_status: string | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
};

export type ChildSummary = {
  id: string;
  name: string;
  grade: string | null;
  school: string | null;
  overall_progress: number;
  lessons_completed: number;
  quizzes_passed: number;
  total_stars: number;
  badges_earned: number;
  current_streak: number;
  roll_number: string | null;
  section: string | null;
  is_primary: boolean;
};

export type ChildProgress = {
  student: {
    id: string;
    name: string;
    grade: string | null;
    school: string | null;
    overall_progress: number;
    total_time_spent_seconds: number;
    lessons_completed: number;
    quizzes_attempted: number;
    quizzes_passed: number;
    badges_earned: number;
    total_stars: number;
    current_streak_days: number;
    last_activity_at: string | null;
  };
  lesson_progress: {
    total_lessons: number;
    completed_lessons: number;
    in_progress_lessons: number;
    not_started_lessons: number;
    average_completion: number;
    last_completed_at: string | null;
  };
};

export type QuizAttempt = {
  id: string;
  quiz_id: string;
  lesson_id: string;
  attempt_number: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken_seconds: number;
  completed_at: string;
  created_at: string;
};

export type Badge = {
  badge_id: string;
  earned_at: string;
  name: string | null;
  description: string | null;
  image_url: string | null;
};

export type SubjectProgress = {
  id: string;
  name: string;
  chapters: Array<{
    id: string;
    name: string;
    sort_order: number;
    total_lessons: number;
    completed_lessons: number;
    completion_percentage: number;
    total_time_spent_seconds: number;
    is_complete: boolean;
  }>;
};

export type ParentDashboard = {
  parent: {
    name: string;
    email: string;
    plan_type: string | null;
    plan_status: string | null;
    plan_expires_at: string | null;
  };
  children: Array<{
    id: string;
    name: string;
    grade: string | null;
    school: string | null;
    overall_progress: number;
    lessons_completed: number;
    quizzes_attempted: number;
    quizzes_passed: number;
    total_stars: number;
    total_badges: number;
    current_streak: number;
    last_activity: string | null;
  }>;
  quick_stats: {
    total_children: number;
    active_plans: number;
    total_payments: number;
    next_payment_due: string | null;
  };
};
