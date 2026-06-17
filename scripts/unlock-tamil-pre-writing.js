const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  console.log('=== Marking Tamil Pre-Writing Foundation as Complete for allaccess@zhi.com ===\n');

  // Get allaccess student
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('email', 'allaccess@zhi.com')
    .maybeSingle();

  if (!student) {
    throw new Error('allaccess@zhi.com student not found');
  }

  // Get board, grade, subject
  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').maybeSingle();
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').maybeSingle();
  const { data: subject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'tamil').maybeSingle();

  // Get Tamil Pre-Writing chapter
  const { data: chapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('subject_id', subject.id)
    .eq('name', 'முன் எழுத்து பயிற்சிகள் - Guide & Trace')
    .is('deleted_at', null)
    .maybeSingle();

  if (!chapter) {
    throw new Error('Tamil Pre-Writing chapter not found');
  }

  // Get all lessons for this chapter
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('chapter_id', chapter.id)
    .is('deleted_at', null);

  if (!lessons || lessons.length === 0) {
    throw new Error('No lessons found in chapter');
  }

  console.log(`   Found ${lessons.length} lessons in chapter`);

  // Mark each lesson as completed
  for (const lesson of lessons) {
    const { data: existingProgress } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('student_id', student.id)
      .eq('lesson_id', lesson.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingProgress) {
      await supabase
        .from('lesson_progress')
        .update({
          completion_percentage: 100,
          status: 'completed',
          activities_completed: true,
          quiz_completed: true,
          quiz_passed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id);
    } else {
      await supabase
        .from('lesson_progress')
        .insert({
          student_id: student.id,
          lesson_id: lesson.id,
          completion_percentage: 100,
          status: 'completed',
          activities_completed: true,
          quiz_completed: true,
          quiz_passed: true
        });
    }

    console.log(`   ✓ ${lesson.title}`);
  }

  console.log(`\n=== Tamil Pre-Writing Foundation unlocked for allaccess@zhi.com! ===\n`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
