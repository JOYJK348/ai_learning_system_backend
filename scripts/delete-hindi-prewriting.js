const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function run() {
  console.log('=== Deleting Hindi Pre-writing Chapter (पूर्व लेखन अभ्यास) ===\n');

  // 1. Get the LKG Hindi subject ID
  const { data: subjects, error: subError } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('code', 'hindi');

  if (subError) {
    console.error('Error fetching Hindi subject:', subError.message);
    return;
  }

  if (!subjects || subjects.length === 0) {
    console.log('Hindi subject not found.');
    return;
  }

  const now = new Date().toISOString();

  for (const subject of subjects) {
    console.log(`Checking subject: ${subject.name} (${subject.id})`);

    // 2. Find the chapter
    const { data: chapters, error: chError } = await supabase
      .from('chapters')
      .select('id, name')
      .eq('subject_id', subject.id)
      .eq('name', 'पूर्व लेखन अभ्यास')
      .is('deleted_at', null);

    if (chError) {
      console.error('  Error fetching chapters:', chError.message);
      continue;
    }

    if (!chapters || chapters.length === 0) {
      console.log('  Chapter "पूर्व लेखन अभ्यास" not found or already deleted.');
      continue;
    }

    for (const ch of chapters) {
      console.log(`  Deleting Chapter: ${ch.name} (${ch.id})`);

      // 3. Find and delete lessons
      const { data: lessons, error: lesError } = await supabase
        .from('lessons')
        .select('id, title')
        .eq('chapter_id', ch.id)
        .is('deleted_at', null);

      if (lesError) {
        console.error('    Error fetching lessons:', lesError.message);
        continue;
      }

      for (const les of lessons) {
        console.log(`    Deleting Lesson: ${les.title} (${les.id})`);

        // Soft delete activities
        await supabase.from('activities').update({ deleted_at: now }).eq('lesson_id', les.id);
        // Soft delete progress
        await supabase.from('lesson_progress').update({ deleted_at: now }).eq('lesson_id', les.id);
        // Soft delete lesson itself
        await supabase.from('lessons').update({ deleted_at: now }).eq('id', les.id);
      }

      // Soft delete chapter
      const { error: chDelError } = await supabase
        .from('chapters')
        .update({ deleted_at: now })
        .eq('id', ch.id);

      if (chDelError) {
        console.error('    Failed to delete chapter:', chDelError.message);
      } else {
        console.log('    Successfully soft-deleted chapter.');
      }
    }
  }

  console.log('\n=== Completed ===');
}

run().catch(err => {
  console.error(err);
});
