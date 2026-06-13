import { Plan } from "@/lib/subscriptions";
import { getAllPlans } from "@/lib/subscriptions";

// Cache plans in memory for 5 minutes to avoid DB calls on every request
let cachedPlans: Plan[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getPlans(): Promise<Plan[]> {
  if (cachedPlans && Date.now() - cacheTime < CACHE_TTL) {
    return cachedPlans;
  }
  cachedPlans = await getAllPlans();
  cacheTime = Date.now();
  return cachedPlans;
}

export async function getPlanByCode(code: string): Promise<Plan | undefined> {
  const plans = await getPlans();
  return plans.find((p) => p.code === code);
}

export async function getPlanById(id: number): Promise<Plan | undefined> {
  const plans = await getPlans();
  return plans.find((p) => p.id === id);
}

// Keep backward-compat for school-admin routes
export type PlanFeature = {
  key: string;
  label: string;
};

export type PlanConfig = {
  type: string;
  name: string;
  price: number;
  displayPrice: string;
  period: string;
  desc: string;
  days: number;
  typeId: number;
  badge_label: string | null;
  max_students: number | null;
  features: PlanFeature[];
};

export const PLANS: PlanConfig[] = [
  {
    type: 'free',
    name: 'Basic',
    price: 0,
    displayPrice: '₹0',
    period: 'forever',
    desc: 'Essential digital learning tools to get your school started',
    days: 0,
    typeId: 1,
    badge_label: null,
    max_students: 50,
    features: [
      { key: 'videos', label: 'Video Lessons' },
      { key: 'quizzes', label: 'Quizzes & Assessments' },
      { key: 'activities', label: 'Interactive Activities' },
    ],
  },
  {
    type: 'paid',
    name: 'Standard',
    price: 1999,
    displayPrice: '₹1,999',
    period: '/month',
    desc: 'Advanced analytics and reporting for data-driven schools',
    days: 30,
    typeId: 2,
    badge_label: 'Most Popular',
    max_students: 200,
    features: [
      { key: 'videos', label: 'Video Lessons' },
      { key: 'quizzes', label: 'Quizzes & Assessments' },
      { key: 'activities', label: 'Interactive Activities' },
      { key: 'reports', label: 'Reports & Analytics' },
    ],
  },
  {
    type: 'school',
    name: 'Premium',
    price: 3000,
    displayPrice: '₹3,000',
    period: '/month',
    desc: 'Complete platform with AI-powered tutoring and bulk management',
    days: 365,
    typeId: 3,
    badge_label: 'Best Value',
    max_students: null,
    features: [
      { key: 'videos', label: 'Video Lessons' },
      { key: 'quizzes', label: 'Quizzes & Assessments' },
      { key: 'activities', label: 'Interactive Activities' },
      { key: 'reports', label: 'Reports & Analytics' },
      { key: 'ai_tutor', label: 'AI Tutor' },
      { key: 'bulk_import', label: 'Bulk Student Import' },
      { key: 'dedicated_support', label: 'Dedicated Support' },
    ],
  },
];

export function getPlanByType(type: string): PlanConfig | undefined {
  return PLANS.find(p => p.type === type);
}

export function getPlanByTypeId(typeId: number): PlanConfig | undefined {
  return PLANS.find(p => p.typeId === typeId);
}

/**
 * Calculate new plan_expires_at when upgrading/changing plans.
 * Uses max(currentExpiry, now) as the base to avoid losing remaining days.
 */
export function calculateNewExpiry(currentExpiry: string | null, planDays: number): string {
  const now = new Date();
  const base = currentExpiry ? new Date(currentExpiry) : now;
  const start = base > now ? base : now;
  const expiry = new Date(start);
  expiry.setDate(expiry.getDate() + planDays);
  return expiry.toISOString();
}
