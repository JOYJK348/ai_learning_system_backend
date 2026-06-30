const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const CHAPTER_IDS = [
  '2d9bd75d-e151-40a5-9542-6166a164a00a', // Chapter 11: Money Basics
  'f7b422d0-4571-439a-b793-24bd0549f4d9'  // Chapter 12: Data Handling
];

async function run() {
  console.log('Starting deletion of Chapter 11 & 12...');

  // 1. Get lesson IDs for these chapters
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id')
    .in('chapter_id', CHAPTER_IDS);

  const lessonIds = (lessons || []).map(l => l.id);
  console.log(`Found ${lessonIds.length} lessons in these chapters.`);

  if (lessonIds.length > 0) {
    // 2. Delete progress entries for these lessons
    console.log('Deleting lesson progress...');
    const { error: pErr } = await supabase
      .from('lesson_progress')
      .delete()
      .in('lesson_id', lessonIds);
    if (pErr) console.error('Error deleting lesson progress:', pErr);

    // 3. Delete activity attempts for these lessons
    console.log('Deleting activity attempts...');
    const { error: aAttErr } = await supabase
      .from('activity_attempts')
      .delete()
      .in('lesson_id', lessonIds);
    if (aAttErr) console.error('Error deleting activity attempts:', aAttErr);

    // 4. Delete activities for these lessons
    console.log('Deleting activities...');
    const { error: actErr } = await supabase
      .from('activities')
      .delete()
      .in('lesson_id', lessonIds);
    if (actErr) console.error('Error deleting activities:', actErr);

    // 5. Delete lessons
    console.log('Deleting lessons from DB...');
    const { error: lesErr } = await supabase
      .from('lessons')
      .delete()
      .in('id', lessonIds);
    if (lesErr) console.error('Error deleting lessons:', lesErr);
  }

  // 6. Delete chapters
  console.log('Deleting chapters from DB...');
  const { error: chErr } = await supabase
    .from('chapters')
    .delete()
    .in('id', CHAPTER_IDS);
  if (chErr) console.error('Error deleting chapters:', chErr);

  console.log('Chapters and lessons deleted successfully from the DB!');
}

run().catch(console.error);
