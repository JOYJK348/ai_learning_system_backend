const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function update() {
  const email = 'joyautomations.system@gmail.com';
  const id = 'a3c55c01-e041-40b9-944e-a51fac17b92c';

  console.log(`Updating admin ${email} to have auth_user_id = ${id}`);

  const { data, error } = await supabase
    .from('admins')
    .update({ auth_user_id: id })
    .eq('email', email)
    .select();

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update succeeded:', data);
  }
}

update();
