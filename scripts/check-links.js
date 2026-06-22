const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: links, error } = await supabase
    .from('parent_student_links')
    .select('parent_id, student_id')
    .eq('student_id', '61f31c52-10f7-4ff2-8b6d-7803a2bb034b');

  if (error) {
    console.error(error);
  } else {
    console.log('Parent links for student:', links);
  }
}
main();
