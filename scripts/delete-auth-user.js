const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function run() {
  const email = 'joyjk348@gmail.com';

  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing auth users:', error);
    return;
  }

  const user = authUsers?.users?.find(u => u.email === email);
  if (user) {
    console.log('Found auth user with ID:', user.id);
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error('Error deleting user:', delErr);
    } else {
      console.log('Successfully deleted user from Supabase Auth!');
    }
  } else {
    console.log('No auth user found with email:', email);
  }

  // Also reset the registration back to pending so they don't have to re-register
  const { data: reg } = await supabase
    .from('parent_registrations')
    .select('id')
    .eq('parent_email', email)
    .maybeSingle();

  if (reg) {
    await supabase
      .from('parent_registrations')
      .update({ status: 'pending', approved_by: null, approved_at: null })
      .eq('id', reg.id);
    console.log('Reset registration back to pending for testing!');
  }
}

run();
