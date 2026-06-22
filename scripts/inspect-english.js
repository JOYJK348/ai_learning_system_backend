const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // Find all subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .is('deleted_at', null);
  
  console.log('SUBJECTS IN DB:', subjects);

  // Find all chapters
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, subject_id')
    .is('deleted_at', null);

  for (const s of subjects) {
    const sChaps = chapters.filter(c => c.subject_id === s.id);
    const chapIds = sChaps.map(c => c.id);
    
    if (chapIds.length === 0) continue;

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, chapter_id')
      .in('chapter_id', chapIds)
      .is('deleted_at', null);

    console.log(`\n=== SUBJECT: ${s.name} ===`);
    for (const l of lessons || []) {
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('lesson_id', l.id)
        .is('deleted_at', null)
        .maybeSingle();

      console.log(`- Lesson: "${l.title}" | ID: ${l.id} | Quiz: ${quiz ? `"${quiz.title}" (ID: ${quiz.id})` : 'NONE'}`);
    }
  }
}

main().catch(console.error);
