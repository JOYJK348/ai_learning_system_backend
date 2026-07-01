const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

const gkGrade1SubjectId = '41d7c420-118c-46ef-ae2f-bea4e87cca7f';

async function main() {
  console.log('Querying existing Grade 1 GK chapters...');
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('subject_id', gkGrade1SubjectId)
    .is('deleted_at', null);

  if (chapters && chapters.length > 0) {
    const chIds = chapters.map(c => c.id);
    console.log('Deleting existing lessons in these chapters...');
    await supabase.from('lessons').delete().in('chapter_id', chIds);
    console.log('Deleting existing chapters...');
    await supabase.from('chapters').delete().in('id', chIds);
  }
  console.log('Cleanup complete!');
}

main().catch(console.error);
