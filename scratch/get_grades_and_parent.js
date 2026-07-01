const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Check grades
  const { data: grades } = await supabase.from('grades').select('*').is('deleted_at', null);
  console.log('Grades in DB:', grades);

  // Check parent allaccess@zhi.com
  const { data: parent } = await supabase
    .from('parents')
    .select('id,email')
    .eq('email', 'allaccess@zhi.com')
    .maybeSingle();

  console.log('Parent allaccess@zhi.com:', parent);
}

run();
