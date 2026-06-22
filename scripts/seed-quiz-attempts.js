const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

const studentId = '61f31c52-10f7-4ff2-8b6d-7803a2bb034b';

const attempts = [
  {
    student_id: studentId,
    quiz_id: '0a196cbf-83e4-4be8-be0e-bfb4a5dad28f',
    lesson_id: '85ecd08f-948d-4ea4-a76a-8405ec53539a',
    attempt_number: 1,
    score: 4,
    max_score: 5,
    percentage: 80,
    passed: true,
    time_taken_seconds: 120,
    completed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    student_id: studentId,
    quiz_id: 'c5346fb8-0bd2-4764-bcd3-5ceecce9341b',
    lesson_id: '08f9fc5b-4fb7-43e3-92f9-f324abc433e9',
    attempt_number: 1,
    score: 5,
    max_score: 5,
    percentage: 100,
    passed: true,
    time_taken_seconds: 95,
    completed_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
  },
  {
    student_id: studentId,
    quiz_id: '5add7d88-9ca7-4c8a-bf65-347acfb3f853',
    lesson_id: 'e8cb109a-c5e0-42e3-a032-b821a321be59',
    attempt_number: 1,
    score: 2,
    max_score: 5,
    percentage: 40,
    passed: false,
    time_taken_seconds: 150,
    completed_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
  }
];

async function main() {
  // Delete any existing quiz attempts to avoid duplication
  await supabase.from('quiz_attempts').delete().eq('student_id', studentId);

  const { error } = await supabase.from('quiz_attempts').insert(attempts);
  if (error) console.error(error);
  else console.log('Successfully inserted quiz attempts');
}
main();
