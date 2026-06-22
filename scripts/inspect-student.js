const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', '61f31c52-10f7-4ff2-8b6d-7803a2bb034b')
    .maybeSingle();

  if (error) {
    console.error('Error fetching student:', error);
    return;
  }
  console.log('STUDENT:', student);

  if (student && student.grade_id) {
    const { data: grade } = await supabase
      .from('grades')
      .select('*')
      .eq('id', student.grade_id)
      .maybeSingle();
    console.log('GRADE:', grade);

    const { data: subjects } = await supabase
      .from('subjects')
      .select('*')
      .eq('grade_id', student.grade_id);
    console.log('SUBJECTS:', subjects);
  }
}
main();

