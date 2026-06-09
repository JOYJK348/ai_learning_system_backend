import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

// GET - List all parents with plan details
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");  // e.g. 'active','expired'
    const planFilter = searchParams.get("plan");       // e.g. 'paid','free'

    const supabase = getSupabaseAdmin();

    // Map text filter params → integer IDs
    const planIdMap: Record<string, number> = { free: 1, paid: 2, school: 3 };
    const planStatusIdMap: Record<string, number> = {
      active: 1, expired: 2, pending: 3, cancelled: 4,
    };

    let query = supabase
      .from("parents")
      .select(`
        id,
        name,
        email,
        phone,
        plan_type_id,
        plan_status_id,
        plan_started_at,
        plan_expires_at,
        status_id,
        created_at,
        plan_type:lookup_plan_types(id, code, name),
        plan_status:lookup_plan_status(id, code, name),
        children:parent_student_links(count),
        recent_payments:payments(amount, payment_status_id, paid_at)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (statusFilter && planStatusIdMap[statusFilter]) {
      query = query.eq("plan_status_id", planStatusIdMap[statusFilter]);
    }
    if (planFilter && planIdMap[planFilter]) {
      query = query.eq("plan_type_id", planIdMap[planFilter]);
    }

    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);

    const parents = (data || []).map((parent: any) => {
      const daysUntilExpiry = parent.plan_expires_at
        ? Math.ceil(
            (new Date(parent.plan_expires_at).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

      // Sum total paid from linked payments with status=success (id=2)
      const successPayments = (parent.recent_payments || []).filter(
        (p: any) => p.payment_status_id === 2
      );
      const totalPaid = successPayments.reduce(
        (sum: number, p: any) => sum + Number(p.amount || 0),
        0
      );
      const lastPayment = successPayments.sort(
        (a: any, b: any) =>
          new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()
      )[0];

      let churnRisk: "low" | "medium" | "high" = "low";
      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0)
        churnRisk = "high";
      else if (daysUntilExpiry <= 14) churnRisk = "medium";

      return {
        id: parent.id,
        parent_id: parent.id,
        parent_name: parent.name || "Unknown",
        parent_email: parent.email || "",
        parent_phone: parent.phone || "",
        plan_type: parent.plan_type?.code || "free",
        plan_name: parent.plan_type?.name || "Free",
        plan_price: 0, // Not stored on parents; comes from plan_types bolt-on table
        status: parent.plan_status?.code || "pending",
        plan_start_date: parent.plan_started_at,
        plan_end_date: parent.plan_expires_at,
        days_until_expiry: daysUntilExpiry,
        total_paid: totalPaid,
        last_payment_date: lastPayment?.paid_at || null,
        children_count: parent.children?.[0]?.count ?? 0,
        churn_risk: churnRisk,
      };
    });

    return json({ data: parents });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}

// PUT - Upgrade/downgrade plan
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const body = await req.json();
    const { parent_id, plan_type_id } = body;

    if (!parent_id || !plan_type_id) {
      return json({ error: "Parent ID and plan_type_id required" }, 400);
    }

    // plan_type_id here is the integer from lookup_plan_types (1=free, 2=paid, 3=school)
    const planIdToCode: Record<number, string> = { 1: "free", 2: "paid", 3: "school" };

    const supabase = getSupabaseAdmin();

    // Get current parent plan for history
    const { data: currentParent } = await supabase
      .from("parents")
      .select("plan_type_id")
      .eq("id", parent_id)
      .single();

    const durationDays = plan_type_id === 2 ? 365 : plan_type_id === 3 ? 365 : 0;

    const updateData: Record<string, any> = {
      plan_type_id,
      plan_status_id: 1, // active
      plan_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (durationDays > 0) {
      updateData.plan_expires_at = new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    const { data, error } = await supabase
      .from("parents")
      .update(updateData)
      .eq("id", parent_id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    // Log plan change to parent_plan_history (from bolt-on schema)
    await supabase.from("parent_plan_history").insert({
      parent_id,
      old_plan_id: currentParent?.plan_type_id ?? null,
      new_plan_id: plan_type_id,
      changed_by: user!.id,
    });

    return json({ data, message: "Plan updated" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}