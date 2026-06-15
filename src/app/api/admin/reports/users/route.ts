import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !requireRole(user, ["super_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

    // Count admins (super_admin / admin)
    const { count: adminCount } = await supabase
      .from("admins")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Count school admins
    const { count: schoolAdminCount } = await supabase
      .from("school_admins")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Count parents + activity
    const { data: allParents } = await supabase
      .from("parents")
      .select("id, created_at, updated_at, plan_type_id")
      .is("deleted_at", null);

    const parentCount = allParents?.length ?? 0;
    const newParents = (allParents || []).filter(
      (p) => p.created_at >= thirtyDaysAgo
    ).length;
    const churnedParents = (allParents || []).filter(
      (p) => p.updated_at < sixtyDaysAgo
    ).length;

    // Plan distribution
    const planMap: Record<string, number> = { free: 0, paid: 0, school: 0 };
    const planIdToCode: Record<number, string> = { 1: "free", 2: "paid", 3: "school" };
    (allParents || []).forEach((p: any) => {
      const code = planIdToCode[p.plan_type_id] || "free";
      planMap[code] = (planMap[code] || 0) + 1;
    });

    // Count students
    const { count: studentCount } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Daily active: students with recent lesson_progress activity
    const { data: dailyLogins } = await supabase
      .from("lesson_progress")
      .select("last_accessed_at")
      .gte("last_accessed_at", thirtyDaysAgo)
      .not("last_accessed_at", "is", null);

    const dailyActive: Record<string, number> = {};
    (dailyLogins || []).forEach((s: any) => {
      const date = s.last_accessed_at.split("T")[0];
      dailyActive[date] = (dailyActive[date] || 0) + 1;
    });

    // Fill last 30 days
    const dates: string[] = [];
    const active: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      dates.push(dateStr);
      active.push(dailyActive[dateStr] || 0);
    }

    const activeUsers =
      (adminCount ?? 0) +
      (schoolAdminCount ?? 0) +
      (allParents || []).filter((p) => p.updated_at >= thirtyDaysAgo).length;

    return json({
      data: {
        total_users: {
          admin: (adminCount ?? 0) + (schoolAdminCount ?? 0),
          parent: parentCount,
          student: studentCount ?? 0,
        },
        active_users: activeUsers,
        new_signups_30d: newParents,
        churned_users: churnedParents,
        churn_rate:
          activeUsers > 0
            ? Math.round((churnedParents / activeUsers) * 100)
            : 0,
        dates,
        daily_active: active,
        plan_distribution: planMap,
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}