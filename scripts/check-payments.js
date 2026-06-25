const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const parentId = 'cc799049-5a59-48d6-96cb-d3325c4d555f';

  // Check payments table
  const { data: payments, error: pErr } = await supabase
    .from('payments')
    .select('*')
    .eq('parent_id', parentId);

  console.log('PAYMENTS TABLE ROWS:', payments);
  if (pErr) console.error('payments error:', pErr);

  // Check parent_payments table
  const { data: parentPayments, error: ppErr } = await supabase
    .from('parent_payments')
    .select('*')
    .eq('parent_id', parentId);

  console.log('PARENT_PAYMENTS TABLE ROWS:', parentPayments);
  if (ppErr) console.error('parent_payments error:', ppErr);
}

main();
