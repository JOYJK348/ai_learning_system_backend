const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  // Get all active lessons (LKG English)
  const { data: activeLessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      chapter:chapters(id, name, subject:subjects(id, name))
    `)
    .is('deleted_at', null)
    .eq('chapter.subject.name', 'English');

  // Get all deleted lessons (LKG English) that have quiz questions
  const { data: deletedLessons } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      chapter:chapters(id, name, subject:subjects(id, name))
    `)
    .not('deleted_at', 'is', null)
    .eq('chapter.subject.name', 'English');

  // Let's print them and see if we can do matching
  console.log(`Active English lessons: ${activeLessons.length}`);
  console.log(`Deleted English lessons: ${deletedLessons.length}`);

  // Let's find matches
  const mappings = [];
  deletedLessons.forEach(dl => {
    // try exact title match or close match
    const cleanDeletedTitle = dl.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Find active lesson with closest title
    const match = activeLessons.find(al => {
      const cleanActiveTitle = al.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      return cleanActiveTitle.includes(cleanDeletedTitle) || cleanDeletedTitle.includes(cleanActiveTitle);
    });

    if (match) {
      mappings.push({
        deletedId: dl.id,
        deletedTitle: dl.title,
        deletedChapter: dl.chapter?.name,
        activeId: match.id,
        activeTitle: match.title,
        activeChapter: match.chapter?.name
      });
    }
  });

  console.log('\n--- TENTATIVE MAPPINGS ---');
  mappings.forEach(m => {
    console.log(`Deleted: "${m.deletedTitle}" (${m.deletedChapter}) ---> Active: "${m.activeTitle}" (${m.activeChapter})`);
  });
}

main().catch(console.error);
