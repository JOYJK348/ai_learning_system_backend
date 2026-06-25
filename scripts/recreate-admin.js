const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function run() {
  const email = 'joyautomations.system@gmail.com';
  const password = 'Admin123!';
  const id = 'a3c55c01-e041-40b9-944e-a51fac17b92c';

  console.log('Recreating auth user for admin:', email);

  const { data, error } = await supabase.auth.admin.createUser({
    id: id,
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { role: 'super_admin', name: 'Super Admin' }
  });

  if (error) {
    console.error('Failed to recreate admin user:', error);
  } else {
    console.log('Successfully recreated super admin user:', data.user.id);
  }
}

run();
