const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: parent } = await supabase
    .from('parents')
    .select('*')
    .eq('email', 'lkgallp@zhi.com')
    .maybeSingle();

  console.log('FOUND PARENT:', parent);

  if (parent) {
    const { data: pPayments } = await supabase
      .from('payments')
      .select('*')
      .eq('parent_id', parent.id);
    console.log('payments table rows for this parent id:', pPayments);

    const { data: ppPayments } = await supabase
      .from('parent_payments')
      .select('*')
      .eq('parent_id', parent.id);
    console.log('parent_payments table rows for this parent id:', ppPayments);
  }
}

main();
