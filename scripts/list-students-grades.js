const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function run() {
  console.log('=== Checking Students and Grades ===\n');

  // Fetch grades
  const { data: grades } = await supabase.from('grades').select('id, name, code');
  console.log('Grades in DB:');
  for (const g of grades || []) {
    console.log(`  Grade ID: ${g.id} | Name: ${g.name} | Code: ${g.code}`);
  }

  console.log('\nStudents in DB:');
  // Fetch students with their grades
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, email, grade_id')
    .is('deleted_at', null);

  for (const s of students || []) {
    const studentGrade = grades?.find(g => g.id === s.grade_id);
    console.log(`  Student: ${s.full_name} (${s.email || 'No Email'})`);
    console.log(`    Grade ID: ${s.grade_id} -> Name: ${studentGrade?.name || 'NOT ASSIGNED/NULL'}`);
  }
}

run().catch(err => {
  console.error(err);
});
