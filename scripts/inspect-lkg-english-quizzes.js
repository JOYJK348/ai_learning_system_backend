const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // Find all English subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, deleted_at')
    .ilike('name', 'English');
  
  console.log('ALL ENGLISH SUBJECTS:', subjects);

  const subjectIds = subjects.map(s => s.id);

  // Find Chapters for these subjects (both active and deleted)
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, subject_id, deleted_at')
    .in('subject_id', subjectIds);

  console.log('\n--- ALL CHAPTERS ---');
  chapters.forEach(c => {
    console.log(`Chapter: "${c.name}" | ID: ${c.id} | Deleted: ${c.deleted_at}`);
  });

  const chapterIds = chapters.map(c => c.id);

  // Find all lessons for these chapters
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, chapter_id, deleted_at')
    .in('chapter_id', chapterIds);

  console.log('\n--- LESSONS FOR CHAPTERS ---');
  lessons.forEach(l => {
    const chap = chapters.find(c => c.id === l.chapter_id);
    console.log(`Lesson: "${l.title}" | ID: ${l.id} | Chapter: "${chap ? chap.name : 'Unknown'}" | Deleted: ${l.deleted_at}`);
  });

  const lessonIds = lessons.map(l => l.id);

  // Find quizzes for these lessons
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('id, title, lesson_id, deleted_at')
    .in('lesson_id', lessonIds);

  console.log('\n--- QUIZZES ---');
  quizzes.forEach(q => {
    const les = lessons.find(l => l.id === q.lesson_id);
    console.log(`Quiz: "${q.title}" | ID: ${q.id} | Lesson: "${les ? les.title : 'Unknown'}" | Deleted: ${q.deleted_at}`);
  });

  const quizIds = quizzes.map(q => q.id);

  // Find count of questions in each quiz
  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, quiz_id, question_text, deleted_at')
    .in('quiz_id', quizIds);

  console.log('\n--- QUIZ QUESTIONS COUNT PER QUIZ ---');
  const countMap = {};
  questions.forEach(q => {
    countMap[q.quiz_id] = (countMap[q.quiz_id] || 0) + 1;
  });

  quizzes.forEach(q => {
    console.log(`Quiz "${q.title}" (ID: ${q.id}) has ${countMap[q.id] || 0} questions.`);
  });
}

main().catch(console.error);
