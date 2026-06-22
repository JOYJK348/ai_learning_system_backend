const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');


async function main() {
  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title, deleted_at, chapter_id, chapters(id, name, deleted_at, subject_id, subjects(id, name, deleted_at))')
    .eq('id', 'd5bafdc2-6180-46cf-b84a-883c2b0dad08')
    .maybeSingle();

  console.log('LESSON DETAILS:', JSON.stringify(lesson, null, 2));
}
main();

