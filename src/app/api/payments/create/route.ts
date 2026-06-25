import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helpers';
import { razorpay } from '@/lib/razorpay';
import { getPlanById } from '@/config/plans';

/**
 * POST /api/payments/create
 *
 * Step 1 of the payment flow:
 * - Validate the plan the parent wants to buy
 * - Create a Razorpay order
 * - Record a "pending" entry in parent_payments (audit trail)
 * - Return order details to the frontend so it can open the Razorpay checkout
 *
 * Safety: Button must be disabled on the frontend after calling this endpoint
 * to prevent double-click duplicate orders.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authResult = await requireAuth(req, ['parent']);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: parentId } = authResult;

    // ── Input Validation ────────────────────────────────────────────────────
    const body = await req.json();
    const { plan_id, interval_type = 'monthly' } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Invalid or inactive plan' }, { status: 400 });
    }

    if (plan.code === 'free') {
      return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 });
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
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    // ── Create Razorpay Order ───────────────────────────────────────────────
    const razorpayOrder = await razorpay.orders.create({
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
      console.error('[payments/create] DB insert error:', paymentError);
      return NextResponse.json({ error: 'Failed to record payment order' }, { status: 500 });
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
    console.error('[payments/create] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
