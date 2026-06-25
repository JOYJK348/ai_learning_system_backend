const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // Let's find all deleted chapters and their lessons that have questions
  const { data: deletedLessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      deleted_at,
      chapter:chapters(id, name, deleted_at, subject:subjects(id, name))
    `)
    .not('deleted_at', 'is', null);

  const { data: activeLessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      chapter:chapters(id, name, subject:subjects(id, name))
    `)
    .is('deleted_at', null);

  console.log('--- DELETED LESSONS ---');
  deletedLessons.forEach(l => {
    console.log(`Deleted Lesson: "${l.title}" | Chapter: "${l.chapter?.name}" (${l.chapter?.subject?.name})`);
  });

  console.log('\n--- ACTIVE LESSONS ---');
  activeLessons.filter(l => l.chapter?.subject?.name === 'English').forEach(l => {
    console.log(`Active Lesson: "${l.title}" | Chapter: "${l.chapter?.name}"`);
  });
}

main().catch(console.error);
