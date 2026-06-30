const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Let's get student details
  const { data: students, error: err1 } = await supabase
    .from('students')
    .select('id,full_name,grade:grades(name)')
    .ilike('full_name', '%kuttyma%');

  if (err1) {
    console.error(err1);
    return;
  }

  console.log('Students:', students);

  if (students && students.length > 0) {
    const studentId = students[0].id;
    // Let's get lesson progress for this student
    const { data: progress, error: err2 } = await supabase
      .from('lesson_progress')
      .select('id,lesson:lessons(title),status,completion_percentage,completed_at')
      .eq('student_id', studentId);

    if (err2) {
      console.error(err2);
      return;
    }

    console.log('Lesson Progress:', progress);
  }
}

run();
