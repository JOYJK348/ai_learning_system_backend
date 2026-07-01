const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const grade1Id = '807cf7be-c596-4fd6-8b6e-ee991ca661a8';

async function run() {
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id,name')
    .eq('grade_id', grade1Id);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Grade 1 Subjects in DB:', subjects);
}

run();
