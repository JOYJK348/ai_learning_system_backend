const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const hindiSubjectId = 'd2ef6924-26fc-42bb-ad13-fac775eb6925'; // Grade 1 Hindi
  const { data: chapters, error: chErr } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('subject_id', hindiSubjectId);
  
  if (chErr) {
    console.error('Error fetching chapters:', chErr);
    return;
  }
  console.log('Chapters:', chapters);
  
  if (chapters && chapters.length > 0) {
    const chIds = chapters.map(c => c.id);
    const { data: lessons, error: lesErr } = await supabase
      .from('lessons')
      .select('id, title, chapter_id')
      .in('chapter_id', chIds);
    if (lesErr) {
      console.error('Error fetching lessons:', lesErr);
    } else {
      console.log('Lessons count:', lessons.length);
      console.log('Lessons:', lessons);
    }
  }
}

main().catch(console.error);
