const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: parents, error: err } = await supabase
    .from('parents')
    .select(`
      id,
      name,
      email,
      parent_student_links (
        id,
        student_id,
        students (
          id,
          full_name,
          overall_progress,
          total_lessons_completed
        )
      )
    `);

  if (err) {
    console.error(err);
    return;
  }

  console.log('Parents and links:', JSON.stringify(parents, null, 2));
}

run();
