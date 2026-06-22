const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', '%tamil%');
  
  console.log('TAMIL SUBJECTS:', subjects);

  const subjectIds = subjects.map(s => s.id);
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name')
    .in('subject_id', subjectIds);

  console.log('TAMIL CHAPTERS:', chapters);

  const chapterIds = chapters.map(c => c.id);
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, chapter_id')
    .in('chapter_id', chapterIds);

  console.log('TAMIL LESSONS & QUIZZES:');
  for (const l of lessons || []) {
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('id, title')
      .eq('lesson_id', l.id)
      .maybeSingle();

    console.log(`- Lesson: "${l.title}" | ID: ${l.id} | Quiz: ${quiz ? `"${quiz.title}" (ID: ${quiz.id})` : 'NONE'}`);
  }
}

main().catch(console.error);
