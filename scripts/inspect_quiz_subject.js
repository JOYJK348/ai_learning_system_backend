const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: chapters } = await supabase
    .from('chapters')
    .select(`
      id,
      name,
      deleted_at,
      subject:subjects(
        id,
        name,
        deleted_at,
        grade:grades(
          id,
          name,
          deleted_at,
          board:boards(
            id,
            name,
            deleted_at
          )
        )
      )
    `)
    .in('name', [
      'Alphabet Revision & Writing',
      'Phonics & Letter Sounds',
      'Vowels & Consonants',
      'Word Building (CVC Words)',
      'Opposite Words',
      'Naming Words (Vocabulary)',
      'Simple Grammar',
      'Sentence Formation',
      'Rhymes & Stories',
      'Conversation Skills'
    ]);

  console.log('Chapters details:');
  chapters.forEach(c => {
    console.log(`Chapter: "${c.name}" (Deleted: ${c.deleted_at})`);
    console.log(`  Subject: "${c.subject?.name}" (Deleted: ${c.subject?.deleted_at})`);
    console.log(`  Grade: "${c.subject?.grade?.name}" (Deleted: ${c.subject?.grade?.deleted_at})`);
    console.log(`  Board: "${c.subject?.grade?.board?.name}" (Deleted: ${c.subject?.grade?.board?.deleted_at})`);
  });
}

main().catch(console.error);
