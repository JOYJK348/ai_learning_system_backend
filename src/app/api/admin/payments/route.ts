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

    const { data, error } = await supabase
      .from("parent_payments")
      .select(`
        *,
        parent:parents!inner(id, name, email, phone),
        plan:plans!inner(id, code, name, amount_monthly)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return json({ error: error.message }, 500);
    }

    const transactions = (data || []).map((t: any) => ({
      id: t.id,
      parent_name: t.parent?.name || "Unknown",
      parent_email: t.parent?.email || "",
      amount: Number(t.amount),
      method: t.interval_type === "monthly" ? "UPI" : "Netbanking",
      status: t.status === "success" ? "success"
        : t.status === "failed" ? "failed"
        : t.status === "refunded" ? "refunded"
        : "pending",
      transaction_id: t.order_id || t.id.slice(0, 8),
      created_at: t.created_at,
      invoice_url: t.id,
      parent_id: t.parent_id,
      plan_id: t.plan_id,
      plan_name: t.plan?.name || "",
      gateway_payment_id: t.payment_id,
    }));

    return json({ data: transactions });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
