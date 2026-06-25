import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helpers';
import { getRazorpay } from '@/lib/razorpay';
import { APIError, errorResponse } from '@/lib/api-error';

/**
 * POST /api/payments/create
 *
 * Step 1 of the payment flow:
 * - Validate the plan the parent wants to buy
 * - Create a Razorpay order
 * - Record a "pending" entry in parent_payments (audit trail)
 * - Return order details to the frontend so it can open the Razorpay checkout
 */
export async function POST(req: NextRequest) {
  let parentId: string | undefined = undefined;
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authResult = await requireAuth(req, ['parent']);
    if (authResult instanceof NextResponse) return authResult;
    parentId = authResult.userId;

    // ── Input Validation ────────────────────────────────────────────────────
    const body = await req.json();
    const { plan_id, interval_type = 'monthly' } = body;

    if (!plan_id) {
      throw new APIError('plan_id is required', 400, 'VALIDATION_ERROR');
    }

    // ── Resolve plan & amount ───────────────────────────────────────────────
    const supabase = getSupabaseAdmin();
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !plan) {
      throw new APIError('Invalid or inactive plan', 400, 'PLAN_NOT_FOUND');
    }

    if (plan.code === 'free') {
      throw new APIError('Free plan does not require payment', 400, 'INVALID_PAYMENT');
    }

    // Pick correct amount based on interval
    let amountInRupees = plan.amount_monthly;
    if (interval_type === 'yearly' && plan.amount_yearly) {
      amountInRupees = plan.amount_yearly;
    } else if (interval_type === 'quarterly' && plan.amount_quarterly) {
      amountInRupees = plan.amount_quarterly;
    }

    const amountInPaise = Math.round(Number(amountInRupees) * 100); // Razorpay uses paise

    // ── Verify parent exists ────────────────────────────────────────────────
    const { data: parent, error: parentError } = await supabase
      .from('parents')
      .select('id, auth_user_id')
      .eq('auth_user_id', parentId)
      .maybeSingle();

    if (parentError || !parent) {
      throw new APIError('Parent profile not found', 404, 'USER_NOT_FOUND');
    }

    // ── Create Razorpay Order ───────────────────────────────────────────────
    const razorpayOrder = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `zhi_${parent.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        parent_id: parent.id,
        plan_id: plan.id,
        plan_code: plan.code,
        interval_type,
      },
    });

    // ── Record pending payment in DB (audit trail) ──────────────────────────
    const { data: payment, error: paymentError } = await supabase
      .from('parent_payments')
      .insert({
        parent_id: parent.id,
        plan_id: plan.id,
        order_id: razorpayOrder.id,
        amount: amountInRupees,
        currency: 'INR',
        interval_type,
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // ── Return to frontend ──────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      payment_record_id: payment.id,
      razorpay_order_id: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
      },
      key_id: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err: any) {
    return errorResponse(err, { route: '/api/payments/create', method: 'POST', userId: parentId });
  }
}
