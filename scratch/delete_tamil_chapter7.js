const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // 1. Delete Chapter 7 from Grade 1 Tamil
  // Chapter 7: மொழி விளையாட்டு 🧠 (ID: ea8ec5ac-f255-458a-8c25-ec8e129e659f)
  
  console.log('Fetching lessons for Chapter 7...');
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title')
    .eq('chapter_id', 'ea8ec5ac-f255-458a-8c25-ec8e129e659f');

  if (lessons && lessons.length > 0) {
    const lessonIds = lessons.map(l => l.id);
    console.log(`Lessons to soft-delete:`, lessonIds);

    // Soft-delete lessons
    const { error: err1 } = await supabase
      .from('lessons')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', lessonIds);
    if (err1) throw err1;
    console.log('Lessons soft-deleted successfully.');
  }

  console.log('Soft-deleting Chapter 7...');
  const { error: err2 } = await supabase
    .from('chapters')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', 'ea8ec5ac-f255-458a-8c25-ec8e129e659f');
  if (err2) throw err2;
  console.log('Chapter 7 soft-deleted successfully.');
}

main().catch(console.error);
