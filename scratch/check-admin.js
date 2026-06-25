const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function check() {
  const email = 'joyautomations.system@gmail.com';

  const { data: admin, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', email);
  
  console.log('Admins matching email:', admin);
  console.log('Error if any:', error);

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const authUser = authUsers?.users?.find(u => u.email === email);
  console.log('Auth user ID from auth:', authUser ? authUser.id : null);
  console.log('Auth user metadata:', authUser ? authUser.user_metadata : null);
}

check();
