import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return null;
  return user;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const supabaseAdmin = getSupabaseAdmin();
    const parentId = params.id;

    // Verify parent exists
    const { data: parent, error: parentError } = await supabaseAdmin
      .from("parents")
      .select("id,plan_type_id")
      .eq("id", parentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (parentError) return json({ error: parentError.message }, 500);
    if (!parent) return json({ error: "Parent not found" }, 404);

    const amount = parseFloat(body.amount || "0");
    if (amount <= 0) return json({ error: "Amount must be greater than 0" }, 400);

    // Success payment status id = 2 (based on seed data)
    const paymentStatusId = 2; // success / manual verified

    // Insert payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .insert({
        parent_id: parentId,
        amount,
        currency: "INR",
        plan_type_id: body.plan_type_id || parent.plan_type_id,
        plan_name_snapshot: body.plan_name || "Manual",
        plan_price_snapshot: amount,
        payment_method_id: body.payment_method_id || null,
        payment_status_id: paymentStatusId,
        gateway_name: "manual",
        notes: body.notes || "Manual payment recorded by admin",
        verified_by: user.profileId || null,
        paid_at: new Date().toISOString(),
        expires_at: body.expires_at || null,
      })
      .select("id,amount,paid_at")
      .single();

    if (paymentError || !payment) {
      return json({ error: paymentError?.message || "Failed to record payment" }, 400);
    }

    // Update parent plan if details given
    const parentUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.plan_type_id) parentUpdates.plan_type_id = body.plan_type_id;
    if (body.plan_status_id) parentUpdates.plan_status_id = body.plan_status_id;
    if (body.plan_expires_at) parentUpdates.plan_expires_at = body.plan_expires_at;

    if (Object.keys(parentUpdates).length > 1) {
      await supabaseAdmin.from("parents").update(parentUpdates).eq("id", parentId);
    }

    return json({ ok: true, data: payment, message: "Payment recorded successfully" }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to record payment" }, 500);
  }
}
