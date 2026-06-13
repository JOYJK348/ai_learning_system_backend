import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const body = await req.json();
    const { payment_id } = body;

    if (!payment_id) return json({ error: "Payment ID required" }, 400);

    const supabase = getSupabaseAdmin();

    // Mark payment as success in parent_payments
    const { data: payment, error: ppError } = await supabase
      .from("parent_payments")
      .update({
        status: "success",
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment_id)
      .select()
      .single();

    if (ppError) return json({ error: ppError.message }, 500);

    // Activate parent subscription
    if (payment?.parent_id) {
      await supabase
        .from("parent_subscriptions")
        .update({ status: "active" })
        .eq("parent_id", payment.parent_id)
        .in("status", ["trial", "active"])
        .order("created_at", { ascending: false })
        .limit(1);

      await supabase
        .from("parents")
        .update({
          status_id: 1,
          plan_status_id: 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.parent_id);
    }

    return json({ data: payment, message: "Payment verified" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
