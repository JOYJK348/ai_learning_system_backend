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

    // payment_status_id=2 → 'success' in lookup_payment_status
    const { data, error } = await supabase
      .from("payments")
      .update({
        payment_status_id: 2,
        verified_by: user!.profileId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment_id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    // Activate parent plan if verified
    if (data?.parent_id) {
      await supabase
        .from("parents")
        .update({
          status_id: 1,        // active
          plan_status_id: 1,   // active
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.parent_id);
    }

    return json({ data, message: "Payment verified" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}