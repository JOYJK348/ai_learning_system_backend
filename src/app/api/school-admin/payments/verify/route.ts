import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getPlanByTypeId, calculateNewExpiry } from "@/config/plans";
import { verifyPaymentSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const { user } = await requireSchoolAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: "Missing required Razorpay payment verification parameters" }, 400);
    }

    // Verify signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return json({ error: "Invalid Razorpay payment signature" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Get the pending payment record
    const { data: payment, error: fetchPayError } = await supabase
      .from("payments")
      .select("*")
      .eq("gateway_order_id", razorpay_order_id)
      .maybeSingle();

    if (fetchPayError || !payment) {
      return json({ error: "Payment record not found" }, 404);
    }

    // If already processed
    if (payment.payment_status_id === 2) {
      return json({ success: true, message: "Payment already successfully verified." });
    }

    const planConfig = getPlanByTypeId(payment.plan_type_id);
    if (!planConfig) {
      return json({ error: "Associated plan configuration not found" }, 404);
    }

    const { data: school } = await supabase
      .from("schools")
      .select("plan_expires_at")
      .eq("id", user.schoolId)
      .maybeSingle();

    if (!school) {
      return json({ error: "Associated school not found" }, 404);
    }

    const now = new Date();
    const newExpiry = calculateNewExpiry(school.plan_expires_at, planConfig.days);

    // Transaction updates: School status & Payment status
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
      .eq("id", user.schoolId);

    if (updateSchoolErr) {
      console.error("School subscription update failed:", updateSchoolErr);
      return json({ error: "Failed to update school subscription plans" }, 500);
    }

    // Update payment record to success
    await supabase
      .from("payments")
      .update({
        payment_status_id: 2, // success
        gateway_payment_id: razorpay_payment_id,
        gateway_signature: razorpay_signature,
        paid_at: now.toISOString(),
        notes: `Online upgrade to ${planConfig.name} plan completed successfully`,
        updated_at: now.toISOString(),
      })
      .eq("id", payment.id);

    return json({
      success: true,
      message: `Successfully upgraded to ${planConfig.name} plan`,
    });

  } catch (err) {
    console.error("POST /api/school-admin/payments/verify error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
