import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getPlans as getParentPlans } from "@/config/plans";
import { PLANS as schoolPlans, getPlanByTypeId } from "@/config/plans";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Parent plans (from DB — 4 tiers)
    const parentPlans = await getParentPlans();

    // School plans (from config — 3 tiers)
    const schoolPlanTiers = schoolPlans.map((p) => ({
      type: p.type,
      name: p.name,
      price: p.price,
      display_price: p.displayPrice,
      period: p.period,
      days: p.days,
      type_id: p.typeId,
      description: p.desc,
      badge_label: p.badge_label,
      max_students: p.max_students,
      features: p.features,
    }));

    // School stats per plan type
    const { data: schools } = await supabase
      .from("schools")
      .select("id, plan_type_id, revenue_total, revenue_this_month")
      .is("deleted_at", null);

    const schoolByPlan: Record<number, { count: number; revenue_total: number; revenue_month: number }> = {};
    for (const s of schools || []) {
      if (!schoolByPlan[s.plan_type_id]) {
        schoolByPlan[s.plan_type_id] = { count: 0, revenue_total: 0, revenue_month: 0 };
      }
      schoolByPlan[s.plan_type_id].count++;
      schoolByPlan[s.plan_type_id].revenue_total += Number(s.revenue_total || 0);
      schoolByPlan[s.plan_type_id].revenue_month += Number(s.revenue_this_month || 0);
    }

    return json({
      data: {
        parent_plans: parentPlans,
        school_plans: schoolPlanTiers.map((p) => ({
          ...p,
          active_schools: schoolByPlan[p.type_id]?.count || 0,
          revenue_total: schoolByPlan[p.type_id]?.revenue_total || 0,
          revenue_month: schoolByPlan[p.type_id]?.revenue_month || 0,
        })),
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
