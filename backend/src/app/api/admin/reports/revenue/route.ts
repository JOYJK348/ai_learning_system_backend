import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !requireRole(user, ["super_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "30d";

    const supabase = getSupabaseAdmin();

    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "7d":  startDate = new Date(now.getTime() - 7   * 86400000); break;
      case "90d": startDate = new Date(now.getTime() - 90  * 86400000); break;
      case "1y":  startDate = new Date(now.getTime() - 365 * 86400000); break;
      default:    startDate = new Date(now.getTime() - 30  * 86400000);
    }

    const startIso = startDate.toISOString();

    // payment_status_id=2 → 'success' | paid_at is the real timestamp column
    const { data: dailyRevenue, error: dailyError } = await supabase
      .from("payments")
      .select("amount, plan_type_id, paid_at")
      .eq("payment_status_id", 2)
      .gte("paid_at", startIso)
      .not("paid_at", "is", null)
      .is("deleted_at", null)
      .order("paid_at", { ascending: true });

    if (dailyError) return json({ error: dailyError.message }, 500);

    // Group by date
    const revenueMap = new Map<string, number>();
    const paidMap = new Map<string, number>();    // plan_type_id=2 → paid

    (dailyRevenue || []).forEach((payment: any) => {
      const date = payment.paid_at.split("T")[0];
      const amount = Number(payment.amount || 0);
      revenueMap.set(date, (revenueMap.get(date) || 0) + amount);
      if (payment.plan_type_id === 2) {
        paidMap.set(date, (paidMap.get(date) || 0) + amount);
      }
    });

    // Fill missing dates
    const dates: string[] = [];
    const revenue: number[] = [];
    const paid: number[] = [];
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dates.push(dateStr);
      revenue.push(revenueMap.get(dateStr) || 0);
      paid.push(paidMap.get(dateStr) || 0);
    }

    const totalRevenue = revenue.reduce((a, b) => a + b, 0);
    const avgDaily = dates.length > 0 ? totalRevenue / dates.length : 0;
    const maxDay = revenue.length > 0 ? Math.max(...revenue) : 0;
    const minDay = revenue.length > 0 ? Math.min(...revenue) : 0;

    // Plan breakdown
    const { data: planBreakdown } = await supabase
      .from("payments")
      .select("amount, plan_type_id")
      .eq("payment_status_id", 2)
      .gte("paid_at", startIso)
      .is("deleted_at", null);

    const planIdToCode: Record<number, string> = { 1: "free", 2: "paid", 3: "school" };
    const planRevenue: Record<string, number> = {};
    (planBreakdown || []).forEach((p: any) => {
      const plan = planIdToCode[p.plan_type_id] || "unknown";
      planRevenue[plan] = (planRevenue[plan] || 0) + Number(p.amount || 0);
    });

    // Month-over-month growth
    const { data: lastMonthData } = await supabase
      .from("payments")
      .select("amount")
      .eq("payment_status_id", 2)
      .gte("paid_at", new Date(now.getTime() - 60 * 86400000).toISOString())
      .lt("paid_at", new Date(now.getTime() - 30 * 86400000).toISOString())
      .is("deleted_at", null);

    const lastMonthRevenue = (lastMonthData || []).reduce(
      (sum, p: any) => sum + Number(p.amount || 0),
      0
    );
    const growth =
      lastMonthRevenue > 0
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    return json({
      data: {
        period,
        dates,
        revenue,
        paid,
        summary: {
          total: totalRevenue,
          average_daily: Math.round(avgDaily),
          max_day: maxDay,
          min_day: minDay,
          growth_percent: Math.round(growth),
        },
        plan_breakdown: planRevenue,
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}