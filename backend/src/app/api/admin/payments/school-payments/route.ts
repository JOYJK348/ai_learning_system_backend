import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Get all schools with plan + payment info
    const { data: schools, error } = await supabase
      .from("schools")
      .select(`
        id, name, code, email, phone, address, city, state,
        plan_type_id, plan_status_id, plan_started_at, plan_expires_at,
        plan_price, setup_fee, discount_percent, max_students, revenue_this_month, revenue_total,
        plan_type:lookup_plan_types(code, name),
        plan_status:lookup_plan_status(id, code, name, color)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return json({ error: error.message }, 500);

    // Get student count per school
    const { data: slinks } = await supabase
      .from("school_students")
      .select("school_id")
      .is("deleted_at", null);

    const studentCounts: Record<string, number> = {};
    for (const s of slinks || []) {
      studentCounts[s.school_id] = (studentCounts[s.school_id] || 0) + 1;
    }

    // Get latest payment per school
    const { data: payments } = await supabase
      .from("payments")
      .select("school_id, amount, paid_at, gateway_name")
      .not("school_id", "is", null)
      .is("deleted_at", null)
      .order("paid_at", { ascending: false });

    const latestPayment: Record<string, any> = {};
    for (const p of payments || []) {
      if (!latestPayment[p.school_id]) latestPayment[p.school_id] = p;
    }

    const result = (schools || []).map((s: any) => {
      const now = new Date();
      const endDate = s.plan_expires_at ? new Date(s.plan_expires_at) : null;
      const daysUntilExpiry = endDate
        ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const lp = latestPayment[s.id];

      return {
        id: s.id,
        type: "school",
        school_id: s.id,
        school_name: s.name || "Unknown",
        school_code: s.code || "",
        school_email: s.email || "",
        school_phone: s.phone || "",
        school_city: s.city || "",
        school_state: s.state || "",
        plan_type: s.plan_type?.code || "free",
        plan_name: s.plan_type?.name || "Free",
        plan_type_id: s.plan_type_id,
        plan_status: s.plan_status?.code || "unknown",
        plan_status_name: s.plan_status?.name || "Unknown",
        plan_status_color: s.plan_status?.color || "#6B7280",
        plan_price: Number(s.plan_price || 0),
        plan_start_date: s.plan_started_at,
        plan_end_date: s.plan_expires_at,
        days_until_expiry: daysUntilExpiry,
        student_count: studentCounts[s.id] || 0,
        max_students: s.max_students || 100,
        revenue_this_month: Number(s.revenue_this_month || 0),
        revenue_total: Number(s.revenue_total || 0),
        // Payment info
        last_paid_amount: lp ? Number(lp.amount) : 0,
        last_paid_at: lp?.paid_at || null,
        last_payment_method: lp?.gateway_name || null,
      };
    });

    return json({ data: result });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
