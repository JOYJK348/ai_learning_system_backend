const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const unwantedChapters = [
  'Rhymes',
  'Final Assessment'
];

async function run() {
  console.log('=== Deleting Unwanted English Chapters ===\n');

  // Find LKG English subject
  const { data: grades } = await supabase.from('grades').select('id, name, code');
  const lkg = grades.find(g => g.code === 'lkg');
  if (!lkg) {
    console.error('LKG Grade not found');
    return;
  }

  const { data: subjects } = await supabase.from('subjects').select('id, name, code, grade_id');
  const english = subjects.find(s => s.grade_id === lkg.id && (s.code === 'english' || s.name.toLowerCase().includes('english')));
  if (!english) {
    console.error('English subject not found for LKG');
    return;
  }

  // Get matching chapters
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .select('id, name, subject_id')
    .eq('subject_id', english.id)
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

    // Fetch lessons
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

        // Soft-delete activities
        const { error: actError } = await supabase
          .from('activities')
          .update({ deleted_at: now })
          .eq('lesson_id', les.id);
        if (actError) {
          console.error(`      Failed to soft-delete activities for lesson ${les.title}:`, actError.message);
        } else {
          console.log(`      Soft-deleted activities.`);
        }

        // Soft-delete progress
        const { error: progError } = await supabase
          .from('lesson_progress')
          .update({ deleted_at: now })
          .eq('lesson_id', les.id);
        if (progError) {
          console.error(`      Failed to soft-delete lesson_progress for lesson ${les.title}:`, progError.message);
        } else {
          console.log(`      Soft-deleted lesson progress.`);
        }

        // Soft-delete lesson
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
