const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

const studentId = '61f31c52-10f7-4ff2-8b6d-7803a2bb034b';

async function main() {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .delete()
    .eq('student_id', studentId);
  
  if (error) {
    console.error('Error clearing attempts:', error);
  } else {
    console.log('Successfully cleared all quiz attempts for Super Star from database.');
  }
}

main().catch(console.error);
