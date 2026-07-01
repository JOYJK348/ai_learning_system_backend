const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Inspecting created test accounts...');

  // Let's get parent auth user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const parentAuthUser = users.users.find(u => u.email === 'allaccess@zhi.com');
  const studentAuthUser = users.users.find(u => u.email === 'grade1student@zhi.com');

  console.log('Parent Auth User:', parentAuthUser?.id);
  console.log('Student Auth User:', studentAuthUser?.id);

  // Let's fetch parent record by email
  const { data: parent } = await supabase
    .from('parents')
    .select('*')
    .eq('email', 'allaccess@zhi.com')
    .maybeSingle();
  console.log('Parent Row:', parent);

  // Let's fetch student record by full_name
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('full_name', 'Grade1 Explorer')
    .maybeSingle();
  console.log('Student Row:', student);
}

run();
