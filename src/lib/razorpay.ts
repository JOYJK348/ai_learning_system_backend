import Razorpay from 'razorpay';
import crypto from 'crypto';

// ── Razorpay SDK singleton ──────────────────────────────────────────────────
// Initialised once and reused across all API routes.
// Throws at startup if env vars are missing so we catch config errors early.

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error(
    '[razorpay] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env'
  );
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── Signature Verification ──────────────────────────────────────────────────
/**
 * Verifies the Razorpay payment signature after a successful checkout.
 * HMAC-SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

// ── Webhook Signature Verification ─────────────────────────────────────────
/**
 * Verifies the signature Razorpay sends with every webhook payload.
 * HMAC-SHA256(raw body, webhook secret)
 */
export function verifyWebhookSignature(
  rawBody: string,
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === razorpaySignature;
}
