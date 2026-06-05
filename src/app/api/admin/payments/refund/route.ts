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

    if (!payment_id) {
      return json({ error: "Payment ID required" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Get payment details
    const { data: payment } = await supabase
      .from('payments')
      .select('*, parent:parents(id, total_paid)')
      .eq('id', payment_id)
      .single();

    if (!payment) {
      return json({ error: "Payment not found" }, 404);
    }

    if (payment.status === 'refunded') {
      return json({ error: "Already refunded" }, 400);
    }

    // Process refund
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
        refunded_by: user!.id,
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    // Update parent total paid
    if (payment.parent?.id) {
      const newTotal = Math.max(0, (payment.parent.total_paid || 0) - payment.amount);
      await supabase
        .from('parents')
        .update({ total_paid: newTotal })
        .eq('id', payment.parent.id);
    }

    // TODO: Process actual refund via Razorpay/Stripe
    // await razorpay.refund(payment.transaction_id);

    return json({ data, message: "Refund processed" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}