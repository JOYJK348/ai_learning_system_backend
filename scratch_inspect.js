const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: quizzes, error } = await supabase
    .from('quiz_questions')
    .select(`
      id,
      quiz:quizzes(
        id,
        lesson:lessons(
          id,
          title,
          chapter:chapters(
            id,
            name,
            subject:subjects(
              id,
              name,
              grade:grades(
                id,
                name
              )
            )
          )
        )
      )
    `)
    .is('deleted_at', null);

  if (error) {
    console.error('Error fetching quiz questions:', error);
    return;
  }

  const counts = {};
  quizzes.forEach(q => {
    const grade = q.quiz?.lesson?.chapter?.subject?.grade?.name || 'Unknown Grade';
    const subject = q.quiz?.lesson?.chapter?.subject?.name || 'Unknown Subject';
    const chapter = q.quiz?.lesson?.chapter?.name || 'Unknown Chapter';
    const key = `${grade} - ${subject} - ${chapter}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  console.log('Quizzes distribution in database:');
  Object.keys(counts).sort().forEach(k => {
    console.log(`- ${k}: ${counts[k]} questions`);
  });
}

run();
