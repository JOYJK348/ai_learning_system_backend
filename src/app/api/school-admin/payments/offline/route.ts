import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getPlanByType } from "@/config/plans";

export async function POST(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) {
    return json({ error: "plan_expired", message: "Your trial has ended. Please contact support." }, 403);
  }
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const planType = String(body.plan_type || "").toLowerCase();
    const referenceCode = String(body.reference_code || "").trim();

    const planConfig = getPlanByType(planType);

    if (!planType || !planConfig || planConfig.type === "free") {
      return json({ error: "Invalid plan_type. Must be 'paid' or 'school'." }, 400);
    }

    if (!referenceCode) {
      return json({ error: "Bank transfer reference code/transaction ID is required" }, 400);
    }

    const supabase = getSupabaseAdmin();

    const { data: school } = await supabase
      .from("schools")
      .select("id, name, plan_type_id")
      .eq("id", user.schoolId)
      .maybeSingle();

    if (!school) return json({ error: "School not found" }, 404);

    if (school.plan_type_id === planConfig.typeId) {
      return json({ error: `You are already on the ${planConfig.name} plan.` }, 400);
    }

    // Insert pending bank transfer payment entry
    const { data: payment, error: insertError } = await supabase
      .from("payments")
      .insert({
        school_id: school.id,
        plan_type_id: planConfig.typeId,
        plan_name_snapshot: planConfig.name,
        plan_price_snapshot: planConfig.price,
        amount: planConfig.price,
        currency: "INR",
        gateway_name: "bank_transfer",
        gateway_payment_id: referenceCode,
        payment_status_id: 1, // pending
        notes: `Bank Transfer Request (Ref: ${referenceCode}) awaiting Super Admin verification`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert offline payment record:", insertError);
      return json({ error: "Failed to submit bank transfer request" }, 500);
    }

    return json({
      success: true,
      message: "Bank transfer reference submitted successfully. Once verified by our team, your plan will activate.",
      data: {
        payment_record_id: payment.id,
        reference_code: referenceCode,
      },
    });

  } catch (err) {
    console.error("POST /api/school-admin/payments/offline error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
