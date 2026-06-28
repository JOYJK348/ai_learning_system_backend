const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Fetching school_admins...');
  const { data: admins, error } = await supabase
    .from('school_admins')
    .select('*');

  if (error) {
    console.error('Error fetching school admins:', error);
    return;
  }
  console.log('School Admins:', JSON.stringify(admins, null, 2));

  console.log('Fetching auth users...');
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Error listing users:', authErr);
    return;
  }
  
  const schoolAuths = users.filter(u => u.email.startsWith('admin.'));
  console.log('School Auth Users:', JSON.stringify(schoolAuths, null, 2));
}

run();
