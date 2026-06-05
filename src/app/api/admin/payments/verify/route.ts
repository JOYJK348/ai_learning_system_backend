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

    if (!payment_id) {
      return json({ error: "Payment ID required" }, 400);
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'verified',
        verified_by: user!.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    // Update parent status if payment verified
    if (data && data.parent_id) {
      await supabase
        .from('parents')
        .update({
          status: 'active',
          plan_status: 'paid',
        })
        .eq('id', data.parent_id);
    }

    return json({ data, message: "Payment verified" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}