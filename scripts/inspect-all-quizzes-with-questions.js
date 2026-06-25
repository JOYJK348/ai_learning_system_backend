const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // Query all quiz questions and find their quiz/lesson/chapter
  const { data: questions, error } = await supabase
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
            subject:subjects(
              id,
              name,
              deleted_at
            )
          )
        )
      )
    `)
    .is('deleted_at', null);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Total quiz questions: ${questions.length}`);
  
  const deletedInfo = {
    active_curriculum: 0,
    deleted_quiz: 0,
    deleted_lesson: 0,
    deleted_chapter: 0,
    deleted_subject: 0,
    missing_quiz: 0
  };

  const sampleQuestions = [];

  questions.forEach(q => {
    const quiz = q.quiz;
    if (!quiz) {
      deletedInfo.missing_quiz++;
      return;
    }
    if (quiz.deleted_at) {
      deletedInfo.deleted_quiz++;
      return;
    }
    const lesson = quiz.lesson;
    if (!lesson) {
      deletedInfo.deleted_lesson++;
      return;
    }
    if (lesson.deleted_at) {
      deletedInfo.deleted_lesson++;
      return;
    }
    const chapter = lesson.chapter;
    if (!chapter) {
      deletedInfo.deleted_chapter++;
      return;
    }
    if (chapter.deleted_at) {
      deletedInfo.deleted_chapter++;
      return;
    }
    const subject = chapter.subject;
    if (!subject) {
      deletedInfo.deleted_subject++;
      return;
    }
    if (subject.deleted_at) {
      deletedInfo.deleted_subject++;
      return;
    }

    deletedInfo.active_curriculum++;
    if (sampleQuestions.length < 20) {
      sampleQuestions.push({
        q_id: q.id,
        text: q.question_text,
        quiz_title: quiz.title,
        lesson_title: lesson.title,
        chapter_name: chapter.name,
        subject_name: subject.name
      });
    }
  });

  console.log('\n--- QUESTIONS SUMMARY BY DELETION STATE ---');
  console.log(deletedInfo);

  console.log('\n--- SAMPLE QUESTIONS IN ACTIVE CURRICULUM ---');
  console.log(sampleQuestions);
}

main().catch(console.error);
