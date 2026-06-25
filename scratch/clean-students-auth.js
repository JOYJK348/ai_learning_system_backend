const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function clean() {
  // Find all auth users ending with @zhi.app
  const { data: authUsers, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const studentsAuth = authUsers?.users?.filter(u => u.email && u.email.endsWith('@zhi.app')) || [];
  console.log(`Found ${studentsAuth.length} student auth users to delete.`);
  for (const student of studentsAuth) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(student.id);
    if (delErr) {
      console.error(`Error deleting student auth ${student.email}:`, delErr);
    } else {
      console.log(`Deleted student auth user: ${student.email}`);
    }
  }

  // Delete students in students table that don't have parent links
  const { data: allStudents } = await supabase.from('students').select('id, full_name, email');
  console.log('Current students in DB:', allStudents);

  if (allStudents && allStudents.length > 0) {
    const { data: links } = await supabase.from('parent_student_links').select('student_id');
    const linkedIds = new Set(links?.map(l => l.student_id) || []);
    
    for (const student of allStudents) {
      if (!linkedIds.has(student.id)) {
        // Delete lesson progress
        await supabase.from('lesson_progress').delete().eq('student_id', student.id);
        // Delete student profile
        const { error: sDelErr } = await supabase.from('students').delete().eq('id', student.id);
        if (sDelErr) {
          console.error(`Failed to delete student row ${student.full_name}:`, sDelErr);
        } else {
          console.log(`Deleted orphan student row: ${student.full_name}`);
        }
      }
    }
  }
  console.log('Cleanup complete!');
}

clean();
