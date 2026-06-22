const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('id, title, lesson_id')
    .is('deleted_at', null);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`TOTAL QUIZZES IN DB: ${quizzes.length}`);
  for (const q of quizzes) {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title, chapter_id, chapters(name, subject_id, subjects(name))')
      .eq('id', q.lesson_id)
      .maybeSingle();

    console.log(`Quiz: "${q.title}" (ID: ${q.id}) | Lesson: "${lesson?.title}" (ID: ${q.lesson_id}) | Subject: "${lesson?.chapters?.subjects?.name}"`);
  }
}
main();
