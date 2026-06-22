const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // Find Mathematics subject
  const { data: subjects, error: subjErr } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', '%math%');
  
  if (subjErr) { console.error(subjErr); return; }
  console.log('MATHEMATICS SUBJECTS:', subjects);

  const subjectIds = subjects.map(s => s.id);

  // Find Chapters
  const { data: chapters, error: chapErr } = await supabase
    .from('chapters')
    .select('id, name, subject_id')
    .in('subject_id', subjectIds);
  
  if (chapErr) { console.error(chapErr); return; }
  console.log('CHAPTERS:', chapters.map(c => ({ id: c.id, name: c.name })));

  const chapterIds = chapters.map(c => c.id);

  // Find Lessons
  const { data: lessons, error: lesErr } = await supabase
    .from('lessons')
    .select('id, title, chapter_id')
    .in('chapter_id', chapterIds);

  if (lesErr) { console.error(lesErr); return; }
  console.log('LESSONS:');
  lessons.forEach(l => {
    console.log(`- Title: "${l.title}" | Lesson ID: ${l.id} | Chapter: "${chapters.find(c => c.id === l.chapter_id)?.name}"`);
  });

  const { data: quizzes, error: qErr } = await supabase
    .from('quizzes')
    .select('id, title, lesson_id')
    .in('lesson_id', lessons.map(l => l.id));
  
  if (qErr) { console.error(qErr); return; }
  console.log('QUIZZES:');
  quizzes.forEach(q => {
    console.log(`- Quiz Title: "${q.title}" | Quiz ID: ${q.id} | Lesson ID: ${q.lesson_id}`);
  });
}

main().catch(console.error);
