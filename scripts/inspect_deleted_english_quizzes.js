const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select(`
      id,
      question_text,
      quiz:quizzes(
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
            subject:subjects(id, name, grade:grades(name))
          )
        )
      )
    `);

  const deletedQuestions = questions.filter(q => {
    const quiz = q.quiz;
    if (!quiz) return true;
    if (quiz.deleted_at) return true;
    const lesson = quiz.lesson;
    if (!lesson || lesson.deleted_at) return true;
    const chapter = lesson.chapter;
    if (!chapter || chapter.deleted_at) return true;
    return false;
  });

  console.log(`Deleted questions count: ${deletedQuestions.length}`);

  const sample = {};
  deletedQuestions.forEach(q => {
    const lessonTitle = q.quiz?.lesson?.title || 'Unknown';
    const chapterName = q.quiz?.lesson?.chapter?.name || 'Unknown';
    const key = `${chapterName} -> ${lessonTitle}`;
    sample[key] = (sample[key] || 0) + 1;
  });

  console.log('Deleted questions by Chapter & Lesson mapping:', sample);
}

main().catch(console.error);
