const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function check() {
  const email = 'joyjk348@gmail.com';

  const { data: schoolReg } = await supabase.from('school_registrations').select('id, status').eq('admin_email', email).maybeSingle();
  console.log('school_registrations:', schoolReg);

  const { data: schoolAdmin } = await supabase.from('school_admins').select('id').eq('email', email).maybeSingle();
  console.log('school_admins:', schoolAdmin);

  const { data: parent } = await supabase.from('parents').select('id').eq('email', email).maybeSingle();
  console.log('parents:', parent);

  const { data: parentReg } = await supabase.from('parent_registrations').select('id, status').eq('parent_email', email).maybeSingle();
  console.log('parent_registrations:', parentReg);

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find(u => u.email === email);
  console.log('Auth user ID:', authUser ? authUser.id : null);
}

check();
