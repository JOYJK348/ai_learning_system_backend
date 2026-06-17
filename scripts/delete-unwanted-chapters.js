const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

const unwantedChapters = [
  'Colors',
  'Shapes',
  'Fruits & Vegetables',
  'Animals',
  'Body Parts',
  'My Family & Myself'
];

async function run() {
  console.log('=== Deleting Unwanted Chapters ===\n');

  // 1. Get the chapters
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, name, subject_id')
    .in('name', unwantedChapters)
    .is('deleted_at', null);

  if (chaptersError) {
    console.error('Error fetching chapters:', chaptersError.message);
    return;
  }

  if (!chapters || chapters.length === 0) {
    console.log('No active chapters found matching the unwanted list.');
    return;
  }

  console.log(`Found ${chapters.length} chapters to delete:`);
  for (const ch of chapters) {
    console.log(`  - [ID: ${ch.id}] ${ch.name}`);
  }

  const now = new Date().toISOString();

  for (const ch of chapters) {
    console.log(`\nProcessing Chapter: ${ch.name} (${ch.id})`);

    // Fetch lessons for this chapter
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('chapter_id', ch.id)
      .is('deleted_at', null);

    if (lessonsError) {
      console.error(`  Error fetching lessons for chapter ${ch.name}:`, lessonsError.message);
      continue;
    }

    if (lessons && lessons.length > 0) {
      console.log(`  Found ${lessons.length} active lessons:`);
      for (const les of lessons) {
        console.log(`    - [Lesson ID: ${les.id}] ${les.title}`);

        // Soft-delete activities for this lesson
        const { error: actError } = await supabase
          .from('activities')
          .update({ deleted_at: now })
          .eq('lesson_id', les.id);
        if (actError) {
          console.error(`      Failed to soft-delete activities for lesson ${les.title}:`, actError.message);
        } else {
          console.log(`      Soft-deleted activities.`);
        }

        // Soft-delete progress for this lesson
        const { error: progError } = await supabase
          .from('lesson_progress')
          .update({ deleted_at: now })
          .eq('lesson_id', les.id);
        if (progError) {
          console.error(`      Failed to soft-delete lesson_progress for lesson ${les.title}:`, progError.message);
        } else {
          console.log(`      Soft-deleted lesson progress.`);
        }

        // Soft-delete the lesson itself
        const { error: lesDelError } = await supabase
          .from('lessons')
          .update({ deleted_at: now })
          .eq('id', les.id);
        if (lesDelError) {
          console.error(`      Failed to soft-delete lesson ${les.title}:`, lesDelError.message);
        } else {
          console.log(`      Soft-deleted lesson itself.`);
        }
      }
    } else {
      console.log(`  No active lessons found for this chapter.`);
    }

    // Soft-delete the chapter
    const { error: chDelError } = await supabase
      .from('chapters')
      .update({ deleted_at: now })
      .eq('id', ch.id);

    if (chDelError) {
      console.error(`  Failed to soft-delete chapter ${ch.name}:`, chDelError.message);
    } else {
      console.log(`  Successfully soft-deleted chapter ${ch.name}.`);
    }
  }

  console.log('\n=== Cleanup Completed ===');
}

run().catch(err => {
  console.error('Execution failed:', err);
});
