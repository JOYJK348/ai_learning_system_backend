const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Checking school registrations...');
  const { data: regs, error } = await supabase
    .from('school_registrations')
    .select('*')
    .eq('admin_email', 'joyjk348@gmail.com');

  if (error) {
    console.error('Error fetching registrations:', error);
    return;
  }
  console.log('Registrations:', JSON.stringify(regs, null, 2));

  console.log('Checking schools...');
  const { data: schools, error: schoolErr } = await supabase
    .from('schools')
    .select('*')
    .eq('email', 'joyjk348@gmail.com');
  if (schoolErr) {
    console.error('Error fetching schools:', schoolErr);
  } else {
    console.log('Schools:', JSON.stringify(schools, null, 2));
  }
}

run();
