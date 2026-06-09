import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

// Lookup IDs from final.sql:
// lookup_payment_status:  pending=1, success=2, failed=3, refunded=4
// lookup_plan_types:      free=1, paid=2, school=3
// lookup_entity_status:   active=1, inactive=2, draft=3, archived=4
// lookup_plan_status:     active=1, expired=2, pending=3, cancelled=4

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date().toISOString().slice(0, 7) + "-01";

    // Today's revenue (payment_status_id=2 means 'success')
    const { data: todayPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("payment_status_id", 2)
      .gte("paid_at", today)
      .is("deleted_at", null);

    // This month revenue
    const { data: monthPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("payment_status_id", 2)
      .gte("paid_at", monthStart)
      .is("deleted_at", null);

    // Total revenue
    const { data: totalPayments } = await supabase
      .from("payments")
      .select("amount")
      .eq("payment_status_id", 2)
      .is("deleted_at", null);

    // Total transactions count
    const { count: totalTransactions } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Pending verification count (status=1 means 'pending')
    const { count: pendingCount } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("payment_status_id", 1)
      .is("deleted_at", null);

    const { data: pendingAmountData } = await supabase
      .from("payments")
      .select("amount")
      .eq("payment_status_id", 1)
      .is("deleted_at", null);

    // Active paid parents (plan_type_id=2 means 'paid', status_id=1 means 'active')
    const { count: activePaid } = await supabase
      .from("parents")
      .select("*", { count: "exact", head: true })
      .eq("plan_type_id", 2)
      .eq("status_id", 1)
      .is("deleted_at", null);

    // Free users (plan_type_id=1 means 'free')
    const { count: freeUsers } = await supabase
      .from("parents")
      .select("*", { count: "exact", head: true })
      .eq("plan_type_id", 1)
      .is("deleted_at", null);

    // Expired plans (plan_status_id=2 means 'expired')
    const { count: expiredUsers } = await supabase
      .from("parents")
      .select("*", { count: "exact", head: true })
      .eq("plan_status_id", 2)
      .is("deleted_at", null);

    // Expiring soon (active + expires within 7 days)
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: expiringSoon } = await supabase
      .from("parents")
      .select("*", { count: "exact", head: true })
      .eq("plan_status_id", 1)
      .lte("plan_expires_at", sevenDaysLater)
      .gt("plan_expires_at", new Date().toISOString())
      .is("deleted_at", null);

    const todayRevenue = todayPayments?.reduce((s, p) => s + Number(p.amount || 0), 0) ?? 0;
    const monthRevenue = monthPayments?.reduce((s, p) => s + Number(p.amount || 0), 0) ?? 0;
    const totalRevenue = totalPayments?.reduce((s, p) => s + Number(p.amount || 0), 0) ?? 0;
    const pendingAmount = pendingAmountData?.reduce((s, p) => s + Number(p.amount || 0), 0) ?? 0;

    const successRate =
      totalTransactions && totalTransactions > 0
        ? Math.round(((totalTransactions - (pendingCount || 0)) / totalTransactions) * 100)
        : 100;

    return json({
      data: {
        today_revenue: todayRevenue,
        this_month_revenue: monthRevenue,
        total_revenue: totalRevenue,
        pending_verification: pendingCount ?? 0,
        pending_amount: pendingAmount,
        total_transactions: totalTransactions ?? 0,
        success_rate: successRate,
        active_paid_users: activePaid ?? 0,
        free_users: freeUsers ?? 0,
        expired_users: expiredUsers ?? 0,
        expiring_soon: expiringSoon ?? 0,
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}