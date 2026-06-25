const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bhrbjmexxnejpbgIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0' // wait, this was truncated or has an issue? Let's check the key from check-db.js
);

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const client = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function run() {
  const { data: logs, error } = await client
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Error logs:', logs);
  if (error) console.error('Error fetching logs:', error);

  const { data: regs, error: regErr } = await client
    .from('parent_registrations')
    .select('id, parent_email, status, child_name')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('Recent registrations:', regs);
}

run();
