import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getParentSubscription, createSubscription, recordPayment } from "@/lib/subscriptions";
import { getPlanById } from "@/config/plans";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["parent"])) return json({ error: "Forbidden" }, 403);

  try {
    const subscription = await getParentSubscription(user!.profileId);
    return json({ data: subscription });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to load subscription" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["parent"])) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const planId = Number(body.plan_id);
    const intervalType = body.interval_type || "monthly"; // monthly, quarterly, yearly

    if (!planId) return json({ error: "plan_id is required" }, 400);

    const plan = await getPlanById(planId);
    if (!plan) return json({ error: "Plan not found" }, 404);

    const parentId = user!.profileId;

    // Check if already has active/trial subscription
    const existing = await getParentSubscription(parentId);
    if (existing && existing.status === "trial") {
      // Upgrade trial → paid
      const sub = await createSubscription(parentId, planId, false);
      const amount = plan.amount_monthly;
      const payment = await recordPayment(parentId, sub.id, planId, amount, intervalType);

      return json({ data: { subscription: sub, payment, amount, currency: "INR" } });
    }

    if (existing && existing.status === "active" && existing.plan_id === planId) {
      return json({ error: "Already subscribed to this plan" }, 400);
    }

    // New subscription (possibly trial for free plan)
    const isTrial = plan.amount_monthly === 0;
    const sub = await createSubscription(parentId, planId, isTrial);

    if (plan.amount_monthly > 0) {
      const payment = await recordPayment(parentId, sub.id, planId, plan.amount_monthly, intervalType);
      return json({ data: { subscription: sub, payment, amount: plan.amount_monthly, currency: "INR" } });
    }

    return json({ data: { subscription: sub, amount: 0 } });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to create subscription" },
      500
    );
  }
}
