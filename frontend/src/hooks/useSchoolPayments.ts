'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { schoolAdminKeys } from '@/core/constants/queryKeys';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

export type SubscriptionInfo = {
  plan_type: string | null;
  plan_type_name: string | null;
  plan_status: string | null;
  plan_status_name: string | null;
  plan_status_color: string | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  days_remaining: number | null;
  plan_price: number;
  setup_fee: number;
  discount_percent: number;
  trial_days: number;
  features: Record<string, boolean>;
  max_students: number;
  max_teachers: number;
};

export type UsageInfo = {
  current_students: number;
  max_students: number;
  usage_percent: number;
};

export type Transaction = {
  id: string;
  amount: number;
  currency: string;
  plan_name_snapshot: string | null;
  payment_method: string | null;
  payment_method_code: string | null;
  payment_status: string | null;
  payment_status_name: string | null;
  payment_status_color: string | null;
  gateway_name: string | null;
  notes: string | null;
  paid_at: string | null;
  created_at: string | null;
};

export type PaymentsData = {
  subscription: SubscriptionInfo;
  usage: UsageInfo;
  transactions: Transaction[];
  revenue: { this_month: number; total: number };
  server_time: string;
};

async function fetchPayments() {
  const res = await fetch(`${API_BASE}/api/school-admin/payments`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch payments');
  const json = await res.json();
  return json.data as PaymentsData;
}

export function usePrefetchSchoolPayments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  useEffect(() => {
    if (!schoolId) return;

    queryClient.prefetchQuery({
      queryKey: schoolAdminKeys.payments(schoolId),
      queryFn: fetchPayments,
      staleTime: 120_000,
    });
  }, [schoolId, queryClient]);
}

export function useSchoolPayments() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;

  return useQuery({
    queryKey: schoolAdminKeys.payments(schoolId),
    queryFn: fetchPayments,
    enabled: !!schoolId,
    staleTime: 120_000,
  });
}

export type UpgradeResult = {
  message: string;
  subscription: SubscriptionInfo;
};

async function fetchUpgrade(planType: string) {
  const res = await fetch(`${API_BASE}/api/school-admin/upgrade`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_type: planType }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Upgrade failed');
  return json.data as UpgradeResult;
}

export type PlanItem = {
  type: string; name: string; price: string; display_price: string;
  numeric_price: number; period: string; desc: string; days: number;
  features: { key: string; label: string }[];
};

async function fetchPlans() {
  const res = await fetch(`${API_BASE}/api/school-admin/plans`, { credentials: 'include' });
  if (!res.ok) return null;
  const json = await res.json();
  return (json.data || json) as PlanItem[];
}

const FALLBACK_PLANS: PlanItem[] = [
  { type: 'free', name: 'Free', price: '₹0', display_price: '₹0', numeric_price: 0, period: 'forever', desc: 'For small schools getting started', days: 0, features: [{ key: 'videos', label: 'Video Lessons' }, { key: 'quizzes', label: 'Quizzes' }, { key: 'activities', label: 'Activities' }] },
  { type: 'paid', name: 'Paid', price: '₹1,999', display_price: '₹1,999', numeric_price: 1999, period: '/month', desc: 'For growing schools with more needs', days: 30, features: [{ key: 'videos', label: 'Video Lessons' }, { key: 'quizzes', label: 'Quizzes' }, { key: 'activities', label: 'Activities' }, { key: 'reports', label: 'Reports & Analytics' }] },
  { type: 'school', name: 'School', price: '₹3,000', display_price: '₹3,000', numeric_price: 3000, period: '/month', desc: 'Full platform access for your school', days: 365, features: [{ key: 'videos', label: 'Video Lessons' }, { key: 'quizzes', label: 'Quizzes' }, { key: 'activities', label: 'Activities' }, { key: 'reports', label: 'Reports & Analytics' }, { key: 'ai_tutor', label: 'AI Tutor' }, { key: 'bulk_import', label: 'Bulk Student Import' }] },
];

export function usePlansConfig() {
  const { user } = useAuth();
  const schoolId = user?.schoolId;
  const { data, isSuccess } = useQuery({
    queryKey: schoolAdminKeys.plans(schoolId),
    queryFn: fetchPlans,
    enabled: !!schoolId,
    staleTime: 300_000,
  });
  return isSuccess && data ? data : FALLBACK_PLANS;
}

export function useSchoolUpgrade() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const schoolId = user?.schoolId;

  return useMutation({
    mutationFn: (planType: string) => fetchUpgrade(planType),
    onSuccess: () => {
      if (schoolId) {
        queryClient.invalidateQueries({ queryKey: schoolAdminKeys.payments(schoolId) });
      }
    },
  });
}
