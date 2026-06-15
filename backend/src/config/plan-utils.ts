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
