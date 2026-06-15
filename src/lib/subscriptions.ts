import { getSupabaseAdmin } from "./supabase-server";

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
  status: "active" | "expired" | "cancelled" | "trial";
  start_date: string;
  end_date: string | null;
  trial_start: string | null;
  trial_end: string | null;
  cancelled_at: string | null;
  restrictions: unknown;
  plan: Plan;
};

export type ParentPayment = {
  id: string;
  parent_id: string;
  subscription_id: string | null;
  plan_id: number;
  order_id: string | null;
  payment_id: string | null;
  amount: number;
  currency: string;
  interval_type: string;
  status: string;
  failure_reason: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export async function getAllPlans(): Promise<Plan[]> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: plans, error: plansError } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (plansError) throw new Error(plansError.message);
  if (!plans?.length) return [];

  const planIds = plans.map((p) => p.id);

  const { data: planFeatures, error: pfError } = await supabaseAdmin
    .from("plan_features")
    .select("plan_id, feature_id, feature_limit, features:feature_id(*)")
    .in("plan_id", planIds);

  if (pfError) throw new Error(pfError.message);

  const featureMap: Record<number, PlanFeature[]> = {};
  for (const pf of planFeatures || []) {
    if (!featureMap[pf.plan_id]) featureMap[pf.plan_id] = [];
    const f = pf.features as any;
    featureMap[pf.plan_id].push({
      id: f.id,
      code: f.code,
      name: f.name,
      description: f.description,
      category: f.category,
      icon: f.icon,
      limit: pf.feature_limit,
    });
  }

  return plans.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description || "",
    amount_monthly: Number(p.amount_monthly),
    amount_quarterly: p.amount_quarterly ? Number(p.amount_quarterly) : null,
    amount_yearly: p.amount_yearly ? Number(p.amount_yearly) : null,
    badge_label: p.badge_label,
    sort_order: p.sort_order,
    is_active: p.is_active,
    trial_days: p.trial_days,
    icon: p.icon,
    features: featureMap[p.id] || [],
  }));
}

export async function getParentSubscription(parentId: string): Promise<ParentSubscription | null> {
  const supabaseAdmin = getSupabaseAdmin();

  // Get latest active subscription
  const { data: sub, error: subError } = await supabaseAdmin
    .from("parent_subscriptions")
    .select("*")
    .eq("parent_id", parentId)
    .in("status", ["active", "trial"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subError) throw new Error(subError.message);
  if (!sub) return null;

  // Get plan details
  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("id", sub.plan_id)
    .maybeSingle();

  if (!plan) return null;

  // Get features for this plan
  const { data: planFeatures } = await supabaseAdmin
    .from("plan_features")
    .select("feature_id, feature_limit, features:feature_id(*)")
    .eq("plan_id", sub.plan_id);

  const features: PlanFeature[] = (planFeatures || []).map((pf: any) => ({
    id: pf.features.id,
    code: pf.features.code,
    name: pf.features.name,
    description: pf.features.description,
    category: pf.features.category,
    icon: pf.features.icon,
    limit: pf.feature_limit,
  }));

  return {
    id: sub.id,
    parent_id: sub.parent_id,
    plan_id: sub.plan_id,
    status: sub.status,
    start_date: sub.start_date,
    end_date: sub.end_date,
    trial_start: sub.trial_start,
    trial_end: sub.trial_end,
    cancelled_at: sub.cancelled_at,
    restrictions: sub.restrictions,
    plan: {
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description || "",
      amount_monthly: Number(plan.amount_monthly),
      amount_quarterly: plan.amount_quarterly ? Number(plan.amount_quarterly) : null,
      amount_yearly: plan.amount_yearly ? Number(plan.amount_yearly) : null,
      badge_label: plan.badge_label,
      sort_order: plan.sort_order,
      is_active: plan.is_active,
      trial_days: plan.trial_days,
      icon: plan.icon,
      features,
    },
  };
}

export async function createSubscription(
  parentId: string,
  planId: number,
  isTrial: boolean
): Promise<ParentSubscription> {
  const supabaseAdmin = getSupabaseAdmin();

  const now = new Date();
  const trialEnd = isTrial ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : null;

  const endDate = isTrial
    ? trialEnd
    : null; // null = ongoing monthly subscription (cancelled later)

  const { data, error } = await supabaseAdmin
    .from("parent_subscriptions")
    .insert({
      parent_id: parentId,
      plan_id: planId,
      status: isTrial ? "trial" : "active",
      start_date: now.toISOString(),
      end_date: endDate?.toISOString() || null,
      trial_start: isTrial ? now.toISOString() : null,
      trial_end: trialEnd?.toISOString() || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Update parents table for backward compat
  await supabaseAdmin
    .from("parents")
    .update({
      plan_type_id: planId,
      plan_status_id: isTrial ? 3 : 1, // 3=pending, 1=active
      plan_started_at: now.toISOString(),
      plan_expires_at: endDate?.toISOString() || null,
    })
    .eq("id", parentId);

  return getParentSubscription(parentId) as Promise<ParentSubscription>;
}

export async function recordPayment(
  parentId: string,
  subscriptionId: string | null,
  planId: number,
  amount: number,
  intervalType: string,
  orderId?: string,
  paymentId?: string,
  signature?: string
): Promise<ParentPayment> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("parent_payments")
    .insert({
      parent_id: parentId,
      subscription_id: subscriptionId,
      plan_id: planId,
      order_id: orderId || null,
      payment_id: paymentId || null,
      signature: signature || null,
      amount,
      interval_type: intervalType,
      status: paymentId ? "success" : "pending",
      confirmed_at: paymentId ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePaymentStatus(
  orderId: string,
  status: string,
  paymentId?: string,
  failureReason?: string
): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();

  const update: Record<string, unknown> = {
    status,
    last_polled_at: new Date().toISOString(),
  };
  if (paymentId) update.payment_id = paymentId;
  if (failureReason) update.failure_reason = failureReason;
  if (status === "success") update.confirmed_at = new Date().toISOString();

  await supabaseAdmin.from("parent_payments").update(update).eq("order_id", orderId);

  // If success, activate subscription
  if (status === "success") {
    const payment = await supabaseAdmin
      .from("parent_payments")
      .select("parent_id, subscription_id, plan_id")
      .eq("order_id", orderId)
      .single();

    if (payment.data?.subscription_id) {
      await supabaseAdmin
        .from("parent_subscriptions")
        .update({
          status: "active",
          end_date: null,
        })
        .eq("id", payment.data.subscription_id);
    }
  }
}

export async function getPaymentByOrder(orderId: string): Promise<ParentPayment | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("parent_payments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  return data;
}

export async function canAccessResource(
  parentId: string,
  resourceType: string,
  resourceValue?: string | number
): Promise<boolean> {
  const subscription = await getParentSubscription(parentId);
  if (!subscription) return false;

  // Trial users get full access
  if (subscription.status === "trial") return true;

  // Check feature limit
  const feature = subscription.plan.features.find((f) => f.code === resourceType);
  if (!feature) return false;

  if (feature.limit === "unlimited") return true;
  if (feature.limit === true) return true;
  if (feature.limit === false) return false;

  // Numeric comparison
  if (typeof resourceValue !== "undefined") {
    const limit = typeof feature.limit === "string" ? parseInt(feature.limit, 10) : feature.limit;
    if (typeof limit === "number") return Number(resourceValue) <= limit;
  }

  return true;
}
