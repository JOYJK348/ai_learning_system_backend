import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) {
    return json({ error: "Only super admin can process refunds" }, 403);
  }

  try {
    const body = await req.json();
    const { payment_id } = body;

    if (!payment_id) return json({ error: "Payment ID required" }, 400);

    const supabase = getSupabaseAdmin();

    // Get payment details
    const { data: payment, error: getError } = await supabase
      .from("parent_payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (getError || !payment) return json({ error: "Payment not found" }, 404);

    if (payment.status === "refunded") {
      return json({ error: "Already refunded" }, 400);
    }

    // Mark as refunded
    const { data, error } = await supabase
      .from("parent_payments")
      .update({
        status: "refunded",
        failure_reason: `Refunded by admin ${user!.profileId}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment_id)
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    // Log to admin activity logs
    await supabase.from("admin_activity_logs").insert({
      admin_id: user!.profileId,
      action_id: 3,
      entity_type: "payments",
      entity_id: payment_id,
      details: { amount: payment.amount, parent_id: payment.parent_id },
    });

    return json({ data, message: "Refund processed" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
