import type { ParentProfile, ChildSummary, ChildProgress, QuizAttempt, Badge, SubjectProgress, ParentDashboard } from '@/types/parent';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `Failed to load ${path}`);
  return payload.data ?? payload;
}

export type PlanFeature = {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  limit: unknown;
};

export type Plan = {
  id: number;
  code: string;
  name: string;
  description: string;
  amount_monthly: number;
  amount_quarterly: number | null;
  amount_yearly: number | null;
  badge_label: string | null;
  sort_order: number;
  is_active: boolean;
  trial_days: number;
  icon: string;
  features: PlanFeature[];
};

export type ParentSubscription = {
  id: string;
  parent_id: string;
  plan_id: number;
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  start_date: string;
  end_date: string | null;
  trial_start: string | null;
  trial_end: string | null;
  plan: Plan;
};

export type SubscribeResult = {
  subscription: ParentSubscription;
  payment?: {
    id: string;
    order_id: string | null;
    amount: number;
    status: string;
  };
  amount: number;
  currency: string;
};

export type ChapterProgress = {
  id: string;
  name: string;
  subjects: Array<{
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
  }>;
};

export const parentApi = {
  plans: () =>
    fetchJson<Plan[]>('/api/plans'),

  subscription: () =>
    fetchJson<ParentSubscription>('/api/parent/subscribe'),

  subscribe: (planId: number, intervalType?: string) =>
    fetchJson<SubscribeResult>('/api/parent/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId, interval_type: intervalType || 'monthly' }),
    }),

  payments: () =>
    fetchJson<unknown[]>('/api/parent/payments'),

  childChapterProgress: (childId: string) =>
    fetchJson<ChapterProgress[]>('/api/parent/children/' + childId + '/chapter-progress'),

  me: () =>
    fetchJson<ParentProfile>('/api/parent/me'),

  children: () =>
    fetchJson<{ children: ChildSummary[] }>('/api/parent/children'),

  dashboard: () =>
    fetchJson<ParentDashboard>('/api/parent/dashboard'),

  childProgress: (childId: string) =>
    fetchJson<ChildProgress>('/api/parent/children/' + childId + '/progress'),

  childQuizzes: (childId: string) =>
    fetchJson<{ quizzes: QuizAttempt[] }>('/api/parent/children/' + childId + '/quizzes'),

  childBadges: (childId: string) =>
    fetchJson<{ badges: Badge[] }>('/api/parent/children/' + childId + '/badges'),

  childTerms: (childId: string) =>
    fetchJson<{ terms: unknown[] }>('/api/parent/children/' + childId + '/terms'),
};

