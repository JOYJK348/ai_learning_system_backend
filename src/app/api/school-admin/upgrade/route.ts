import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { PLANS, getPlanByType, calculateNewExpiry } from "@/config/plans";

export async function POST(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your trial has ended. Please contact support." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const targetPlan = String(body.plan_type || "").toLowerCase();
    const planConfig = getPlanByType(targetPlan);

    if (!targetPlan || !planConfig || planConfig.type === "free") {
      return json({ error: "Invalid plan_type. Must be 'paid' or 'school'." }, 400);
    }

    const supabase = getSupabaseAdmin();

    const { data: school } = await supabase
      .from("schools")
      .select("plan_type_id, plan_expires_at")
      .eq("id", user.schoolId)
      .maybeSingle();

    if (!school) return json({ error: "School not found" }, 404);

    if (school.plan_type_id === planConfig.typeId) {
      return json({ error: `You are already on the ${planConfig.name} plan.` }, 400);
    }

    const now = new Date();
    const newExpiry = calculateNewExpiry(school.plan_expires_at, planConfig.days);

    const { error: updateErr } = await supabase
      .from("schools")
      .update({
        plan_type_id: planConfig.typeId,
        plan_status_id: 1,
        plan_started_at: now.toISOString(),
        plan_expires_at: newExpiry,
        plan_price: planConfig.price,
        setup_fee: 0,
        discount_percent: 0,
        updated_at: now.toISOString(),
      })
      .eq("id", user.schoolId);

    if (updateErr) return json({ error: updateErr.message }, 500);

    const { data: planTypes } = await supabase.from("lookup_plan_types").select("id, code, name");
    const planTypeInfo = planTypes?.find(p => p.id === planConfig.typeId);

    await supabase.from("payments").insert({
      school_id: user.schoolId,
      plan_type_id: planConfig.typeId,
      plan_price_snapshot: planConfig.price,
      amount: planConfig.price,
      currency: "INR",
      gateway_name: "manual_upgrade",
      paid_at: now.toISOString(),
      notes: `Self-upgrade to ${planTypeInfo?.name || planConfig.name} plan`,
    });

    return json({
      data: {
        message: `Successfully upgraded to ${planTypeInfo?.name || planConfig.name} plan`,
        subscription: {
          plan_type: planTypeInfo?.code ?? planConfig.type,
          plan_type_name: planTypeInfo?.name ?? null,
          plan_status: "active",
          plan_status_name: "Active",
          plan_status_color: "#22C55E",
          plan_started_at: now.toISOString(),
          plan_expires_at: newExpiry,
          plan_price: planConfig.price,
          setup_fee: 0,
          discount_percent: 0,
          features: planConfig.features.reduce<Record<string, boolean>>((acc, f) => {
            acc[f.key] = true;
            return acc;
          }, {}),
          max_students: planConfig.days > 0 ? 500 : 100,
        },
      },
    });
  } catch (err) {
    console.error("POST /api/school-admin/upgrade error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
