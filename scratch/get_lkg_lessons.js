const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Let's get LKG Tamil subject
  const { data: subjects, error: err } = await supabase
    .from('subjects')
    .select(`
      id,
      name,
      grade:grades(name),
      chapters (
        id,
        name,
        lessons (
          id,
          title
        )
      )
    `);

  if (err) {
    console.error(err);
    return;
  }

  const lkgTamil = subjects.find(s => s.name.toLowerCase().includes('tamil') && s.grade.name.toUpperCase() === 'LKG');
  console.log('LKG Tamil subject:', JSON.stringify(lkgTamil, null, 2));
}

run();
