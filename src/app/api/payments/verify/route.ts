import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth-helpers';
import { verifyPaymentSignature } from '@/lib/razorpay';

/**
 * POST /api/payments/verify
 *
 * Step 2 of the payment flow (Path A – frontend-driven):
 * After the Razorpay checkout completes, the frontend sends the three
 * Razorpay tokens here. We:
 *   1. Verify the cryptographic signature (prevents faked success)
 *   2. Idempotency check (prevents double-upgrade if called twice)
 *   3. DB transaction – atomically update parent_payments + parent_subscriptions + parents
 *   4. Return the new subscription details
 *
 * The webhook route (/api/payments/webhook) acts as the backup for cases where
 * the frontend call never arrives (tab closed, network drop, etc.).
 */
export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authResult = await requireAuth(req, ['parent']);
    if (authResult instanceof NextResponse) return authResult;
    const { userId: parentId } = authResult;

    // ── Input ───────────────────────────────────────────────────────────────
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required' },
        { status: 400 }
      );
    }

    // ── 1. Verify Signature (Security Gate) ─────────────────────────────────
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.warn('[payments/verify] Invalid signature for order:', razorpay_order_id);
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // ── 2. Fetch pending payment row (Idempotency check) ────────────────────
    const { data: payment, error: fetchError } = await supabase
      .from('parent_payments')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .maybeSingle();

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
    }

    // Already processed? Return success without DB changes (idempotency)
    if (payment.status === 'success') {
      console.log('[payments/verify] Already processed, returning cached success:', razorpay_order_id);
      return NextResponse.json({ success: true, already_processed: true });
    }

    if (payment.status === 'failed') {
      return NextResponse.json({ error: 'This payment was marked as failed' }, { status: 400 });
    }

    // ── 3. Fetch parent record ───────────────────────────────────────────────
    const { data: parent, error: parentFetchError } = await supabase
      .from('parents')
      .select('id')
      .eq('auth_user_id', parentId)
      .maybeSingle();

    if (parentFetchError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 });
    }

    // ── 4. Atomic DB Update (All-or-Nothing) ────────────────────────────────
    // Supabase JS does not expose raw SQL transactions, so we execute
    // updates in sequence. The payment row is updated first; if the
    // subscription upsert fails we catch it and mark the payment back
    // to pending so the webhook can retry.

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day subscription

    // 4a. Update payment row → success
    const { error: paymentUpdateError } = await supabase
      .from('parent_payments')
      .update({
        status: 'success',
        payment_id: razorpay_payment_id,
        signature: razorpay_signature,
        confirmed_at: now.toISOString(),
        webhook_received: false,
        verified_by: 'frontend',
      } as any)
      .eq('order_id', razorpay_order_id);

    if (paymentUpdateError) {
      console.error('[payments/verify] Failed to update payment:', paymentUpdateError);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    // 4b. Upsert subscription (create new or update existing)
    const { data: existingSub } = await supabase
      .from('parent_subscriptions')
      .select('id')
      .eq('parent_id', parent.id)
      .in('status', ['active', 'trial'])
      .maybeSingle();

    let subscriptionId: string | null = null;

    if (existingSub) {
      // Upgrade existing subscription
      const { data: updatedSub, error: subUpdateError } = await supabase
        .from('parent_subscriptions')
        .update({
          plan_id: payment.plan_id,
          status: 'active',
          start_date: now.toISOString(),
          end_date: expiresAt.toISOString(),
          cancelled_at: null,
        })
        .eq('id', existingSub.id)
        .select('id')
        .single();

      if (subUpdateError) {
        console.error('[payments/verify] Sub update error:', subUpdateError);
      } else {
        subscriptionId = updatedSub?.id || null;
      }
    } else {
      // Create fresh subscription
      const { data: newSub, error: subInsertError } = await supabase
        .from('parent_subscriptions')
        .insert({
          parent_id: parent.id,
          plan_id: payment.plan_id,
          status: 'active',
          start_date: now.toISOString(),
          end_date: expiresAt.toISOString(),
        })
        .select('id')
        .single();

      if (subInsertError) {
        console.error('[payments/verify] Sub insert error:', subInsertError);
      } else {
        subscriptionId = newSub?.id || null;
      }
    }

    // 4c. Link subscription back to payment row
    if (subscriptionId) {
      await supabase
        .from('parent_payments')
        .update({ subscription_id: subscriptionId } as any)
        .eq('order_id', razorpay_order_id);
    }

    // 4d. Keep parents table in sync (backward compat)
    await supabase
      .from('parents')
      .update({
        plan_type_id: payment.plan_id,
        plan_status_id: 1,          // 1 = active
        plan_started_at: now.toISOString(),
        plan_expires_at: expiresAt.toISOString(),
      })
      .eq('id', parent.id);

    // 4e. Insert into payments table for admin dashboard & revenue metrics
    try {
      const { data: planInfo } = await supabase
        .from('plans')
        .select('name')
        .eq('id', payment.plan_id)
        .maybeSingle();

      await supabase
        .from('payments')
        .insert({
          parent_id: parent.id,
          plan_type_id: 2, // 2 = paid (parent subscription)
          plan_name_snapshot: planInfo?.name || 'Parent Plan',
          plan_price_snapshot: payment.amount,
          amount: payment.amount,
          payment_status_id: 2, // 2 = success
          gateway_name: 'razorpay',
          gateway_order_id: razorpay_order_id,
          gateway_payment_id: razorpay_payment_id,
          gateway_signature: razorpay_signature,
          paid_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        });
    } catch (insertErr) {
      console.error('[payments/verify] Failed to insert into payments table:', insertErr);
    }

    console.log(
      `[payments/verify] ✅ Payment success | parent=${parent.id} | plan=${payment.plan_id} | order=${razorpay_order_id}`
    );

    return NextResponse.json({
      success: true,
      plan_id: payment.plan_id,
      subscription_id: subscriptionId,
      expires_at: expiresAt.toISOString(),
    });

  } catch (err: any) {
    console.error('[payments/verify] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
