const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function run() {
  console.log('=== Locating Letter Checkpoint Chapter and Find the Letter Lesson ===\n');

  // 1. Find the chapter "Letter Checkpoint"
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, name')
    .ilike('name', '%Checkpoint%')
    .is('deleted_at', null);

  if (chaptersError) {
    console.error('Error fetching chapters:', chaptersError.message);
    return;
  }

  if (!chapters || chapters.length === 0) {
    console.log('No active chapters found matching "Checkpoint".');
    return;
  }

  console.log(`Found ${chapters.length} chapters matching Checkpoint:`);
  for (const ch of chapters) {
    console.log(`  - [Chapter ID: ${ch.id}] ${ch.name}`);
  }

  const now = new Date().toISOString();

  for (const ch of chapters) {
    // 2. Find the lesson "Find the Letter" under this chapter
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('chapter_id', ch.id)
      .ilike('title', '%Find the Letter%')
      .is('deleted_at', null);

    if (lessonsError) {
      console.error(`  Error fetching lessons for chapter ${ch.name}:`, lessonsError.message);
      continue;
    }

    if (!lessons || lessons.length === 0) {
      console.log(`  No active "Find the Letter" lessons found in chapter ${ch.name}.`);
      continue;
    }

    console.log(`  Found ${lessons.length} lessons to delete:`);
    for (const les of lessons) {
      console.log(`    - [Lesson ID: ${les.id}] ${les.title}`);

      // Soft-delete activities for this lesson
      const { error: actError } = await supabase
        .from('activities')
        .update({ deleted_at: now })
        .eq('lesson_id', les.id);
      if (actError) {
        console.error(`      Failed to soft-delete activities:`, actError.message);
      } else {
        console.log(`      Soft-deleted activities.`);
      }

      // Soft-delete progress for this lesson
      const { error: progError } = await supabase
        .from('lesson_progress')
        .update({ deleted_at: now })
        .eq('lesson_id', les.id);
      if (progError) {
        console.error(`      Failed to soft-delete lesson_progress:`, progError.message);
      } else {
        console.log(`      Soft-deleted lesson progress.`);
      }

      // Soft-delete the lesson itself
      const { error: lesDelError } = await supabase
        .from('lessons')
        .update({ deleted_at: now })
        .eq('id', les.id);
      if (lesDelError) {
        console.error(`      Failed to soft-delete lesson itself:`, lesDelError.message);
      } else {
        console.log(`      Successfully soft-deleted lesson itself.`);
      }
    }
  }

  console.log('\n=== Run Finished ===');
}

run().catch(err => {
  console.error('Execution failed:', err);
});
