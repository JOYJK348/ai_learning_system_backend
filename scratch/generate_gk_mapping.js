const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

const gkGrade1SubjectId = '41d7c420-118c-46ef-ae2f-bea4e87cca7f';

async function main() {
  console.log('Querying GK chapters and lessons...');
  
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', gkGrade1SubjectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  const mapping = {};

  for (const ch of chapters || []) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, sort_order')
      .eq('chapter_id', ch.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    for (const les of lessons || []) {
      // Calculate level ID: (chapterIndex * 5) + lessonSortOrder
      const levelId = ((ch.sort_order - 1) * 5) + les.sort_order;
      mapping[les.id] = levelId;
    }
  }

  console.log('GK Mapping Record:');
  console.log(JSON.stringify(mapping, null, 2));
}

main().catch(console.error);
