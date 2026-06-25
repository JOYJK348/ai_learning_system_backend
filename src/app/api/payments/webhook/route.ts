import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { verifyWebhookSignature } from '@/lib/razorpay';

/**
 * POST /api/payments/webhook
 *
 * Backup safety net – Razorpay calls this directly (server-to-server),
 * bypassing the browser entirely. Handles cases where:
 *   – User closed the tab after paying
 *   – Network dropped before /verify was called
 *   – Mobile battery died mid-payment
 *
 * Security:
 *   – Raw body is read before JSON.parse so the HMAC signature is verified
 *     against the exact bytes Razorpay sent.
 *   – Idempotency: if payment_id is already in DB as "success", we return
 *     200 OK immediately without touching the DB again.
 *
 * Razorpay retries the webhook 3× if we return anything other than 2xx.
 */
export async function POST(req: NextRequest) {
  // ── 1. Read raw body (required for signature verification) ───────────────
  const rawBody = await req.text();
  const razorpaySignature = req.headers.get('x-razorpay-signature') || '';

  // ── 2. Verify webhook signature ──────────────────────────────────────────
  const isValid = verifyWebhookSignature(rawBody, razorpaySignature);
  if (!isValid) {
    console.warn('[payments/webhook] ❌ Invalid webhook signature – possible spoofing attempt');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── 3. Parse event ───────────────────────────────────────────────────────
  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const eventType: string = event?.event || '';
  console.log('[payments/webhook] Event received:', eventType);

  // We only care about successful payment captures
  if (eventType !== 'payment.captured') {
    return NextResponse.json({ received: true, skipped: true });
  }

  const paymentEntity = event?.payload?.payment?.entity;
  if (!paymentEntity) {
    return NextResponse.json({ error: 'Missing payment entity' }, { status: 400 });
  }

  const {
    id: razorpayPaymentId,
    order_id: razorpayOrderId,
    status: paymentStatus,
  } = paymentEntity;

  if (paymentStatus !== 'captured') {
    return NextResponse.json({ received: true, skipped: true });
  }

  const supabase = getSupabaseAdmin();

  // ── 4. Idempotency check ─────────────────────────────────────────────────
  const { data: existingPayment, error: fetchError } = await supabase
    .from('parent_payments')
    .select('*')
    .eq('order_id', razorpayOrderId)
    .maybeSingle();

  if (fetchError) {
    console.error('[payments/webhook] DB fetch error:', fetchError);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!existingPayment) {
    // Order not in our DB — log and ignore (could be test event)
    console.warn('[payments/webhook] Order not found in DB:', razorpayOrderId);
    return NextResponse.json({ received: true, skipped: true });
  }

  // Already success from frontend verify route — no need to process again
  if (existingPayment.status === 'success') {
    console.log('[payments/webhook] Already processed (idempotent):', razorpayOrderId);
    // Mark webhook as received for audit purposes
    await supabase
      .from('parent_payments')
      .update({ webhook_received: true, webhook_payload: event } as any)
      .eq('order_id', razorpayOrderId);
    return NextResponse.json({ received: true, already_processed: true });
  }

  // ── 5. Process payment (same logic as /verify but webhook-triggered) ─────
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + 30);

  // 5a. Update payment row
  await supabase
    .from('parent_payments')
    .update({
      status: 'success',
      payment_id: razorpayPaymentId,
      confirmed_at: now.toISOString(),
      webhook_received: true,
      webhook_payload: event,
      verified_by: 'webhook',
    } as any)
    .eq('order_id', razorpayOrderId);

  // 5b. Upsert subscription
  const { data: existingSub } = await supabase
    .from('parent_subscriptions')
    .select('id')
    .eq('parent_id', existingPayment.parent_id)
    .in('status', ['active', 'trial'])
    .maybeSingle();

  let subscriptionId: string | null = null;

  if (existingSub) {
    const { data: updatedSub } = await supabase
      .from('parent_subscriptions')
      .update({
        plan_id: existingPayment.plan_id,
        status: 'active',
        start_date: now.toISOString(),
        end_date: expiresAt.toISOString(),
        cancelled_at: null,
      })
      .eq('id', existingSub.id)
      .select('id')
      .single();
    subscriptionId = updatedSub?.id || null;
  } else {
    const { data: newSub } = await supabase
      .from('parent_subscriptions')
      .insert({
        parent_id: existingPayment.parent_id,
        plan_id: existingPayment.plan_id,
        status: 'active',
        start_date: now.toISOString(),
        end_date: expiresAt.toISOString(),
      })
      .select('id')
      .single();
    subscriptionId = newSub?.id || null;
  }

  // 5c. Link subscription to payment
  if (subscriptionId) {
    await supabase
      .from('parent_payments')
      .update({ subscription_id: subscriptionId } as any)
      .eq('order_id', razorpayOrderId);
  }

  // 5d. Sync parents table
  await supabase
    .from('parents')
    .update({
      plan_type_id: existingPayment.plan_id,
      plan_status_id: 1,
      plan_started_at: now.toISOString(),
      plan_expires_at: expiresAt.toISOString(),
    })
    .eq('id', existingPayment.parent_id);

  console.log(
    `[payments/webhook] ✅ Webhook processed | parent=${existingPayment.parent_id} | plan=${existingPayment.plan_id} | order=${razorpayOrderId}`
  );

  // Return 200 so Razorpay doesn't retry
  return NextResponse.json({ received: true, success: true });
}
