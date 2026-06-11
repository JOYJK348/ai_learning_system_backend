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
  features: PlanFeature[];
};

export const PLANS: PlanConfig[] = [
  {
    type: 'free',
    name: 'Free',
    price: 0,
    displayPrice: '₹0',
    period: 'forever',
    desc: 'For small schools getting started',
    days: 0,
    typeId: 1,
    features: [
      { key: 'videos', label: 'Video Lessons' },
      { key: 'quizzes', label: 'Quizzes' },
      { key: 'activities', label: 'Activities' },
    ],
  },
  {
    type: 'paid',
    name: 'Paid',
    price: 1999,
    displayPrice: '₹1,999',
    period: '/month',
    desc: 'For growing schools with more needs',
    days: 30,
    typeId: 2,
    features: [
      { key: 'videos', label: 'Video Lessons' },
      { key: 'quizzes', label: 'Quizzes' },
      { key: 'activities', label: 'Activities' },
      { key: 'reports', label: 'Reports & Analytics' },
    ],
  },
  {
    type: 'school',
    name: 'School',
    price: 3000,
    displayPrice: '₹3,000',
    period: '/month',
    desc: 'Full platform access for your school',
    days: 365,
    typeId: 3,
    features: [
      { key: 'videos', label: 'Video Lessons' },
      { key: 'quizzes', label: 'Quizzes' },
      { key: 'activities', label: 'Activities' },
      { key: 'reports', label: 'Reports & Analytics' },
      { key: 'ai_tutor', label: 'AI Tutor' },
      { key: 'bulk_import', label: 'Bulk Student Import' },
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
