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
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date().toISOString().slice(0, 7) + "-01";

    // ──────────────────────────────────────────
    // Parent Payments (parent_payments table)
    // ──────────────────────────────────────────
    const { data: todayPp } = await supabase
      .from("parent_payments").select("amount").eq("status", "success").gte("confirmed_at", today);
    const { data: monthPp } = await supabase
      .from("parent_payments").select("amount").eq("status", "success").gte("confirmed_at", monthStart);
    const { data: totalPp } = await supabase
      .from("parent_payments").select("amount").eq("status", "success");
    const { count: totalParentTx } = await supabase
      .from("parent_payments").select("*", { count: "exact", head: true });
    const { count: pendingParent } = await supabase
      .from("parent_payments").select("*", { count: "exact", head: true }).eq("status", "pending");
    const { data: pendingAmtData } = await supabase
      .from("parent_payments").select("amount").eq("status", "pending");
    const { count: successParent } = await supabase
      .from("parent_payments").select("*", { count: "exact", head: true }).eq("status", "success");

    // ──────────────────────────────────────────
    // School Payments (payments table — school_id NOT NULL)
    // ──────────────────────────────────────────
    const successStatusId = 2; // lookup_payment_status where code='success'

    const { data: todaySchool } = await supabase
      .from("payments").select("amount").eq("payment_status_id", successStatusId)
      .not("school_id", "is", null).gte("paid_at", today).is("deleted_at", null);
    const { data: monthSchool } = await supabase
      .from("payments").select("amount").eq("payment_status_id", successStatusId)
      .not("school_id", "is", null).gte("paid_at", monthStart).is("deleted_at", null);
    const { data: totalSchool } = await supabase
      .from("payments").select("amount").eq("payment_status_id", successStatusId)
      .not("school_id", "is", null).is("deleted_at", null);
    const { count: totalSchoolTx } = await supabase
      .from("payments").select("*", { count: "exact", head: true })
      .not("school_id", "is", null).is("deleted_at", null);
    const { count: pendingSchool } = await supabase
      .from("payments").select("*", { count: "exact", head: true })
      .eq("payment_status_id", 1).not("school_id", "is", null).is("deleted_at", null);

    // School counts
    const { count: totalSchools } = await supabase
      .from("schools").select("*", { count: "exact", head: true }).is("deleted_at", null);
    const { count: paidSchools } = await supabase
      .from("schools").select("*", { count: "exact", head: true })
      .in("plan_type_id", [2, 3]).is("deleted_at", null);
    const { count: expiredSchools } = await supabase
      .from("schools").select("*", { count: "exact", head: true })
      .eq("plan_status_id", 2).is("deleted_at", null);

    // Schools expiring soon (active + within 7 days)
    const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowISO = new Date().toISOString();
    const { count: schoolsExpiring } = await supabase
      .from("schools").select("*", { count: "exact", head: true })
      .eq("plan_status_id", 1).lte("plan_expires_at", sevenDaysLater)
      .gte("plan_expires_at", nowISO).is("deleted_at", null);

    // ──────────────────────────────────────────
    // Parent subscription counts
    // ──────────────────────────────────────────
    const { count: activePaid } = await supabase
      .from("parent_subscriptions").select("*", { count: "exact", head: true })
      .eq("status", "active").neq("plan_id", 1);
    const { count: expiredSubs } = await supabase
      .from("parent_subscriptions").select("*", { count: "exact", head: true }).eq("status", "expired");
    const { count: subsExpiring } = await supabase
      .from("parent_subscriptions").select("*", { count: "exact", head: true })
      .eq("status", "active").not("end_date", "is", null)
      .lte("end_date", sevenDaysLater).gte("end_date", nowISO);

    const { data: allParents } = await supabase.from("parents").select("id").is("deleted_at", null);
    const { data: subscribedParents } = await supabase
      .from("parent_subscriptions").select("parent_id").in("status", ["active", "trial"]);
    const subscribedIds = new Set((subscribedParents || []).map((s: any) => s.parent_id));
    const freeUsers = (allParents || []).filter((p: any) => !subscribedIds.has(p.id)).length;

    // ──────────────────────────────────────────
    // Compute totals
    // ──────────────────────────────────────────
    const todayRev = (todayPp?.reduce((s, p) => s + Number(p.amount), 0) ?? 0) + 
                     (todaySchool?.reduce((s, p) => s + Number(p.amount), 0) ?? 0);
    const monthRev = (monthPp?.reduce((s, p) => s + Number(p.amount), 0) ?? 0) + 
                     (monthSchool?.reduce((s, p) => s + Number(p.amount), 0) ?? 0);
    const totalRev = (totalPp?.reduce((s, p) => s + Number(p.amount), 0) ?? 0) + 
                     (totalSchool?.reduce((s, p) => s + Number(p.amount), 0) ?? 0);
    const pendingAmt = pendingAmtData?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;
    const totalTx = (totalParentTx ?? 0) + (totalSchoolTx ?? 0);
    const successCount = (successParent ?? 0);
    const successRate = totalTx > 0 ? Math.round((successCount / totalTx) * 100) : 100;

    return json({
      data: {
        today_revenue: todayRev,
        this_month_revenue: monthRev,
        total_revenue: totalRev,
        pending_verification: (pendingParent ?? 0) + (pendingSchool ?? 0),
        pending_amount: pendingAmt,
        total_transactions: totalTx,
        success_rate: successRate,
        // Parent specific
        active_paid_users: activePaid ?? 0,
        free_users: freeUsers,
        expired_users: expiredSubs ?? 0,
        expiring_soon: subsExpiring ?? 0,
        // School specific
        total_schools: totalSchools ?? 0,
        paid_schools: paidSchools ?? 0,
        expired_schools: expiredSchools ?? 0,
        schools_expiring_soon: schoolsExpiring ?? 0,
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
