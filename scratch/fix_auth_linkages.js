const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Fixing parent and student auth_user_id linkages...');

  // Get auth user IDs
  const { data: users } = await supabase.auth.admin.listUsers();
  const parentAuthUser = users.users.find(u => u.email === 'allaccess@zhi.com');
  const studentAuthUser = users.users.find(u => u.email === 'grade1student@zhi.com');

  if (!parentAuthUser) {
    console.error('Could not find allaccess@zhi.com user in auth');
    return;
  }
  if (!studentAuthUser) {
    console.error('Could not find grade1student@zhi.com user in auth');
    return;
  }

  console.log('Parent Auth ID:', parentAuthUser.id);
  console.log('Student Auth ID:', studentAuthUser.id);

  // Update parents table
  const { error: parentErr } = await supabase
    .from('parents')
    .update({ auth_user_id: parentAuthUser.id })
    .eq('email', 'allaccess@zhi.com');

  if (parentErr) {
    console.error('Error updating parent:', parentErr);
  } else {
    console.log('Successfully updated parent auth_user_id!');
  }

  // Update students table
  const { error: studentErr } = await supabase
    .from('students')
    .update({ 
      auth_user_id: studentAuthUser.id,
      email: 'grade1student@zhi.com'
    })
    .eq('full_name', 'Grade1 Explorer');

  if (studentErr) {
    console.error('Error updating student:', studentErr);
  } else {
    console.log('Successfully updated student auth_user_id and email!');
  }
}

run();
