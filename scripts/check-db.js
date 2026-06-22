const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: parent } = await supabase
    .from('parents')
    .select('id, name')
    .eq('email', 'lkgallp@zhi.com')
    .maybeSingle();

  console.log('PARENT RECORD:', parent);

  const { data: links } = await supabase
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_id', parent.id);

  console.log('LINKS:', links);

  for (const link of links || []) {
    const { data: student } = await supabase
      .from('students')
      .select('id, full_name, email, total_stars_earned, total_lessons_completed')
      .eq('id', link.student_id)
      .maybeSingle();

    console.log('BEFORE UPDATE:', student);

    const calculatedStars = (student.total_lessons_completed || 0) * 5;
    
    const { data: updatedStudent, error } = await supabase
      .from('students')
      .update({ total_stars_earned: calculatedStars })
      .eq('id', student.id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
    } else {
      console.log('AFTER UPDATE:', {
        id: updatedStudent.id,
        full_name: updatedStudent.full_name,
        total_stars_earned: updatedStudent.total_stars_earned,
        total_lessons_completed: updatedStudent.total_lessons_completed
      });
    }
  }
}

main();
