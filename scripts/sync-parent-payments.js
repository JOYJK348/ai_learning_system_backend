const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  console.log('Starting sync from parent_payments to payments...');

  // 1. Fetch all successful parent_payments
  const { data: parentPayments, error: ppErr } = await supabase
    .from('parent_payments')
    .select('*, plans(name)')
    .eq('status', 'success');

  if (ppErr) {
    console.error('Error fetching parent payments:', ppErr);
    return;
  }

  console.log(`Found ${parentPayments?.length || 0} successful parent payments.`);

  if (!parentPayments || parentPayments.length === 0) {
    console.log('No successful parent payments to sync.');
    return;
  }

  // 2. Fetch existing payments to prevent duplicate gateway_payment_ids
  const { data: existingPayments, error: pErr } = await supabase
    .from('payments')
    .select('gateway_payment_id')
    .not('gateway_payment_id', 'is', null);

  if (pErr) {
    console.error('Error fetching existing payments:', pErr);
    return;
  }

  const existingIds = new Set(existingPayments.map(p => p.gateway_payment_id));

  // 3. Sync missing payments
  let syncCount = 0;
  for (const pp of parentPayments) {
    const paymentId = pp.payment_id;
    if (!paymentId) continue;

    if (existingIds.has(paymentId)) {
      console.log(`Payment ${paymentId} already synced. Skipping.`);
      continue;
    }

    console.log(`Syncing payment ${paymentId} of amount ${pp.amount}...`);

    const { error: insertErr } = await supabase
      .from('payments')
      .insert({
        parent_id: pp.parent_id,
        plan_type_id: 2, // 2 = paid (parent subscription)
        plan_name_snapshot: pp.plans?.name || 'Parent Plan',
        plan_price_snapshot: pp.amount,
        amount: pp.amount,
        payment_status_id: 2, // 2 = success
        gateway_name: 'razorpay',
        gateway_order_id: pp.order_id,
        gateway_payment_id: pp.payment_id,
        gateway_signature: pp.signature,
        paid_at: pp.confirmed_at || pp.created_at,
        expires_at: pp.expires_at,
      });

    if (insertErr) {
      console.error(`Error inserting payment ${paymentId}:`, insertErr);
    } else {
      syncCount++;
    }
  }

  console.log(`Sync complete. Synced ${syncCount} payments successfully.`);
}

main();
