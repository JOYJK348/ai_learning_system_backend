const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: attempts, error } = await supabase
    .from('quiz_attempts')
    .select('id, student_id, quiz_id, lesson_id, score, max_score, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(attempts, null, 2));
  }
}
main();
