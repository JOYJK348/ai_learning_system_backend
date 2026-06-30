const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // Step 1: Find the "Conversation Skills" chapter(s)
  const { data: chapters, error: chapErr } = await supabase
    .from('chapters')
    .select('id, name, deleted_at')
    .ilike('name', '%Conversation Skills%');

  if (chapErr) { console.error('Error finding chapters:', chapErr); return; }
  console.log('Found chapters:', chapters);

  if (!chapters || chapters.length === 0) {
    console.log('No "Conversation Skills" chapter found in DB.');
    return;
  }

  const chapterIds = chapters.map(c => c.id);
  console.log('Chapter IDs to delete:', chapterIds);

  // Step 2: Find all lessons under these chapters
  const { data: lessons, error: lessonErr } = await supabase
    .from('lessons')
    .select('id, title')
    .in('chapter_id', chapterIds);

  if (lessonErr) { console.error('Error finding lessons:', lessonErr); return; }
  console.log('Found lessons:', lessons?.map(l => l.title));

  const lessonIds = lessons?.map(l => l.id) ?? [];

  if (lessonIds.length > 0) {
    // Step 3: Find all activities under these lessons
    const { data: activities } = await supabase
      .from('activities')
      .select('id')
      .in('lesson_id', lessonIds);

    const activityIds = activities?.map(a => a.id) ?? [];
    console.log(`Found ${activityIds.length} activities to delete`);

    // Step 4: Delete activity_attempts for these activities
    if (activityIds.length > 0) {
      const { error: attErr } = await supabase
        .from('activity_attempts')
        .delete()
        .in('activity_id', activityIds);
      if (attErr) console.error('Error deleting attempts:', attErr);
      else console.log('✅ Deleted activity_attempts');
    }

    // Step 5: Delete activities
    const { error: actErr } = await supabase
      .from('activities')
      .delete()
      .in('lesson_id', lessonIds);
    if (actErr) console.error('Error deleting activities:', actErr);
    else console.log('✅ Deleted activities');

    // Step 6: Delete lesson_progress for these lessons
    const { error: lpErr } = await supabase
      .from('lesson_progress')
      .delete()
      .in('lesson_id', lessonIds);
    if (lpErr) console.error('Error deleting lesson_progress:', lpErr);
    else console.log('✅ Deleted lesson_progress');

    // Step 7: Delete lessons
    const { error: lErr } = await supabase
      .from('lessons')
      .delete()
      .in('chapter_id', chapterIds);
    if (lErr) console.error('Error deleting lessons:', lErr);
    else console.log('✅ Deleted lessons');
  }

  // Step 8: Delete chapters
  const { error: cErr } = await supabase
    .from('chapters')
    .delete()
    .in('id', chapterIds);
  if (cErr) console.error('Error deleting chapters:', cErr);
  else console.log('✅ Deleted chapters');

  console.log('\n🎉 Done! "Conversation Skills" fully removed from DB.');
}

main().catch(console.error);
