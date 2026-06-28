import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getPlanByTypeId, calculateNewExpiry } from "@/config/plans";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();

    const { data: offlinePayments, error: fetchError } = await supabase
      .from("payments")
      .select(`
        id, amount, currency, plan_type_id, plan_name_snapshot,
        gateway_name, gateway_payment_id, payment_status_id,
        notes, paid_at, created_at,
        schools!school_id(name)
      `)
      .eq("gateway_name", "bank_transfer")
      .eq("payment_status_id", 1) // pending
      .order("created_at", { ascending: false });

    if (fetchError) {
      return json({ error: fetchError.message }, 500);
    }

    const formatted = (offlinePayments || []).map((p: any) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      plan_type_id: p.plan_type_id,
      plan_name: p.plan_name_snapshot,
      gateway_name: p.gateway_name,
      reference_code: p.gateway_payment_id, // transaction ID
      status_id: p.payment_status_id,
      notes: p.notes,
      created_at: p.created_at,
      school_name: p.schools?.name || "Unknown School",
    }));

    return json({ data: formatted });

  } catch (err) {
    console.error("GET /api/admin/payments/school-approvals error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { payment_id, action, rejection_reason } = body; // action: 'approve' | 'reject'

    if (!payment_id || !action) {
      return json({ error: "payment_id and action ('approve' or 'reject') are required" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Fetch the pending offline payment record
    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .maybeSingle();

    if (fetchError || !payment) {
      return json({ error: "Payment record not found" }, 404);
    }

    if (payment.payment_status_id !== 1) {
      return json({ error: "Payment is not in pending status" }, 400);
    }

    const now = new Date();

    if (action === "reject") {
      // Reject bank transfer request
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          payment_status_id: 3, // failed
          notes: `Rejected by Admin. Reason: ${rejection_reason || "Verification failed"}`,
          updated_at: now.toISOString(),
        })
        .eq("id", payment_id);

      if (updateError) {
        return json({ error: updateError.message }, 500);
      }

      return json({ success: true, message: "Offline payment request rejected successfully." });
    }

    if (action === "approve") {
      const planConfig = getPlanByTypeId(payment.plan_type_id);
      if (!planConfig) {
        return json({ error: "Plan configuration not found" }, 404);
      }

      const { data: school } = await supabase
        .from("schools")
        .select("plan_expires_at")
        .eq("id", payment.school_id)
        .maybeSingle();

      if (!school) {
        return json({ error: "Associated school profile not found" }, 404);
      }

      const newExpiry = calculateNewExpiry(school.plan_expires_at, planConfig.days);

      // Upgrade school plan
      const { error: updateSchoolErr } = await supabase
        .from("schools")
        .update({
          plan_type_id: planConfig.typeId,
          plan_status_id: 1, // active
          plan_started_at: now.toISOString(),
          plan_expires_at: newExpiry,
          plan_price: planConfig.price,
          setup_fee: 0,
          discount_percent: 0,
          updated_at: now.toISOString(),
        })
        .eq("id", payment.school_id);

      if (updateSchoolErr) {
        return json({ error: "Failed to update school subscription" }, 500);
      }

      // Approve payment transaction log
      const { error: updatePayErr } = await supabase
        .from("payments")
        .update({
          payment_status_id: 2, // success
          verified_by: user.profileId || user.id,
          paid_at: now.toISOString(),
          notes: `Bank Transfer approved by Admin. Transaction Reference: ${payment.gateway_payment_id}`,
          updated_at: now.toISOString(),
        })
        .eq("id", payment_id);

      if (updatePayErr) {
        return json({ error: "Failed to update payment log" }, 500);
      }

      return json({ success: true, message: "Bank transfer approved and subscription activated." });
    }

    return json({ error: "Invalid action. Must be 'approve' or 'reject'." }, 400);

  } catch (err) {
    console.error("POST /api/admin/payments/school-approvals error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
