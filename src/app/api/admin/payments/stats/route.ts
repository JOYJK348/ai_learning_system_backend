import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Today's revenue
    const today = new Date().toISOString().split('T')[0];
    const { data: todayPayments, error: todayError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'success')
      .gte('created_at', today);

    // This month revenue
    const monthStart = new Date().toISOString().slice(0, 7) + '-01';
    const { data: monthPayments, error: monthError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'success')
      .gte('created_at', monthStart);

    // Total revenue
    const { data: totalPayments, error: totalError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'success');

    // Counts
    const { count: totalTransactions } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    const { count: pendingCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: pendingAmountData } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'pending');

    // Parent counts by plan
    const { count: activePaid } = await supabase
      .from('parents')
      .select('*', { count: 'exact', head: true })
      .eq('plan_type', 'paid')
      .eq('status', 'active');

    const { count: freeUsers } = await supabase
      .from('parents')
      .select('*', { count: 'exact', head: true })
      .eq('plan_type', 'free');

    const { count: expiredUsers } = await supabase
      .from('parents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'expired');

    const { count: expiringSoon } = await supabase
      .from('parents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lte('plan_end_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    const todayRevenue = todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const monthRevenue = monthPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const totalRevenue = totalPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const pendingAmount = pendingAmountData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const successRate = totalTransactions && totalTransactions > 0
      ? Math.round(((totalTransactions - (pendingCount || 0)) / totalTransactions) * 100)
      : 100;

    const stats = {
      today_revenue: todayRevenue,
      this_month_revenue: monthRevenue,
      total_revenue: totalRevenue,
      pending_verification: pendingCount || 0,
      pending_amount: pendingAmount,
      total_transactions: totalTransactions || 0,
      success_rate: successRate,
      active_paid_users: activePaid || 0,
      free_users: freeUsers || 0,
      expired_users: expiredUsers || 0,
      expiring_soon: expiringSoon || 0,
    };

    return json({ data: stats });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}