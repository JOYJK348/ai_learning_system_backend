import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getPlanByType } from "@/config/plans";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) {
    return json({ error: "plan_expired", message: "Your trial has ended. Please contact support." }, 403);
  }
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const planType = String(body.plan_type || "").toLowerCase();
    const planConfig = getPlanByType(planType);

    if (!planType || !planConfig || planConfig.type === "free") {
      return json({ error: "Invalid plan_type. Must be 'paid' or 'school'." }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Verify school exists
    const { data: school } = await supabase
      .from("schools")
      .select("id, name, plan_type_id")
      .eq("id", user.schoolId)
      .maybeSingle();

    if (!school) return json({ error: "School not found" }, 404);

    if (school.plan_type_id === planConfig.typeId) {
      return json({ error: `You are already on the ${planConfig.name} plan.` }, 400);
    }

    const amountInPaise = Math.round(Number(planConfig.price) * 100);

    // Create Razorpay Order
    const razorpayOrder = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `sch_${school.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        school_id: school.id,
        plan_type: planConfig.type,
        plan_type_id: planConfig.typeId.toString(),
      },
    });

    // Record pending transaction in payments table
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        school_id: school.id,
        plan_type_id: planConfig.typeId,
        plan_name_snapshot: planConfig.name,
        plan_price_snapshot: planConfig.price,
        amount: planConfig.price,
        currency: "INR",
        gateway_name: "razorpay",
        gateway_order_id: razorpayOrder.id,
        payment_status_id: 1, // pending
        notes: `Pending online upgrade to ${planConfig.name} plan`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert pending payment:", insertError);
      return json({ error: "Failed to record payment initialization" }, 500);
    }

    return json({
      data: {
        payment_record_id: payment.id,
        razorpay_order_id: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        plan_name: planConfig.name,
        key_id: process.env.RAZORPAY_KEY_ID,
      },
    });

  } catch (err) {
    console.error("POST /api/school-admin/payments/create-order error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
