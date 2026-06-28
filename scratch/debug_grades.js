const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
} catch (e) {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. List all grades in the system
  const { data: allGrades } = await supabase.from('grades').select('id, name, code').order('name');
  console.log('\n=== ALL GRADES IN SYSTEM ===');
  console.table(allGrades);

  // 2. List all schools
  const { data: schools } = await supabase.from('schools').select('id, name').is('deleted_at', null);
  console.log('\n=== SCHOOLS ===');
  console.table(schools);

  if (!schools?.length) return;

  for (const school of schools) {
    console.log(`\n=== SCHOOL: ${school.name} (${school.id}) ===`);

    // 3. Get students in this school
    const { data: schoolStudents } = await supabase
      .from('school_students')
      .select('student_id, section, roll_number')
      .eq('school_id', school.id)
      .is('deleted_at', null);

    console.log(`  Total school_students rows: ${schoolStudents?.length ?? 0}`);

    if (!schoolStudents?.length) continue;

    const studentIds = schoolStudents.map(s => s.student_id).filter(Boolean);

    // 4. Get student grade_ids
    const { data: students } = await supabase
      .from('students')
      .select('id, full_name, grade_id')
      .in('id', studentIds)
      .is('deleted_at', null);

    console.log('\n  Student grade_ids:');
    console.table(students?.map(s => ({ name: s.full_name, grade_id: s.grade_id })));

    // 5. Count unique grade_ids
    const uniqueGrades = new Set(students?.map(s => s.grade_id).filter(Boolean));
    console.log(`\n  Unique grade_ids with values: ${uniqueGrades.size}`);
    console.log(`  Unique grade_ids: ${[...uniqueGrades].join(', ')}`);

    // 6. Resolve grade names
    if (uniqueGrades.size > 0) {
      const { data: gradeNames } = await supabase
        .from('grades')
        .select('id, name')
        .in('id', [...uniqueGrades]);
      console.log('\n  Grade names resolved:');
      console.table(gradeNames);
    }

    // 7. Students with NULL grade_id
    const nullGrade = students?.filter(s => !s.grade_id) ?? [];
    if (nullGrade.length > 0) {
      console.log(`\n  ⚠️  ${nullGrade.length} students have NULL grade_id:`);
      console.table(nullGrade.map(s => ({ name: s.full_name, grade_id: s.grade_id })));
    }
  }
}

run().catch(console.error);
