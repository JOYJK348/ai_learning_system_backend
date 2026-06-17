const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function run() {
  console.log('=== Listing Subjects and Grades ===\n');

  // Fetch grades
  const { data: grades } = await supabase.from('grades').select('id, name, code');
  // Fetch subjects
  const { data: subjects } = await supabase.from('subjects').select('id, name, code, grade_id').is('deleted_at', null);

  for (const s of subjects || []) {
    const grade = grades?.find(g => g.id === s.grade_id);
    console.log(`Subject: ${s.name} (${s.code || 'no code'})`);
    console.log(`  Grade: ${grade ? grade.name : 'NULL/ORPHANED'} (${s.grade_id})`);

    // Fetch chapters for this subject
    const { data: chapters } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', s.id)
      .is('deleted_at', null);

    console.log(`  Chapters (${chapters?.length || 0}):`);
    for (const c of chapters || []) {
      console.log(`    - ${c.name}`);
    }
    console.log();
  }
}

run().catch(err => {
  console.error(err);
});
