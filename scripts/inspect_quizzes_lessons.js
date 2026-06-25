const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      deleted_at,
      lesson:lessons(
        id,
        title,
        deleted_at,
        chapter:chapters(
          id,
          name,
          deleted_at,
          subject:subjects(name)
        )
      )
    `);

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('quiz_id')
    .is('deleted_at', null);

  const countMap = {};
  questions.forEach(q => {
    countMap[q.quiz_id] = (countMap[q.quiz_id] || 0) + 1;
  });

  quizzes.forEach(q => {
    const qCount = countMap[q.id] || 0;
    if (qCount > 0) {
      console.log(`Quiz: "${q.title}" (Q Count: ${qCount}) | Quiz Deleted: ${q.deleted_at} | Lesson: "${q.lesson?.title}" (Lesson Deleted: ${q.lesson?.deleted_at}) | Chapter: "${q.lesson?.chapter?.name}" (Chapter Deleted: ${q.lesson?.chapter?.deleted_at})`);
    }
  });
}

main().catch(console.error);
