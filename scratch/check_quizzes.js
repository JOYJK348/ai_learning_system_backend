const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Let's check some mapped quiz IDs:
  const quizIds = [
    '15f5fe29-ca56-4e74-92df-5435127a6bef', // UKG Tamil Mission 1
    '82624c67-b519-4230-82c5-b7aa7dc73f9f', // UKG Tamil Mission 2
    'b06685fc-e309-41fd-82d6-7ee22d93648c', // UKG Math 1
    '38b6ceee-066a-4b85-93c7-7f8d05e51546'  // UKG English 1
  ];

  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('id, lesson_id, title')
    .in('id', quizIds);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Quizzes found in DB:', quizzes);

  // Let's also fetch ALL quizzes in the database to see what they are!
  const { data: allQuizzes, error: errAll } = await supabase
    .from('quizzes')
    .select('id, lesson_id, title')
    .limit(20);

  if (errAll) {
    console.error(errAll);
    return;
  }

  console.log('First 20 quizzes in DB:', allQuizzes);
}

run();
