const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: students, error } = await supabase
    .from('students')
    .select('id, full_name, email, auth_user_id');

  if (error) {
    console.error(error);
  } else {
    for (const student of students) {
      const { data: links } = await supabase
        .from('parent_student_links')
        .select('parent_id')
        .eq('student_id', student.id);
      
      console.log(`Student: ${student.full_name} (${student.id}) linked to parents:`, links);
    }
  }
}
main();
