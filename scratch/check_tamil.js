const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const lkgTamilId = '14b9de26-756d-46fc-9c2f-292db2315f5a';
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', lkgTamilId)
    .order('sort_order', { ascending: true });
  
  console.log('\n--- LKG Tamil Chapters in DB ---');
  for (const c of chapters.slice(0, 3)) {
    console.log(`\nChapter ${c.sort_order}: [${c.id}] ${c.name}`);
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, sort_order')
      .eq('chapter_id', c.id)
      .order('sort_order', { ascending: true });
    
    for (const l of lessons) {
      console.log(`  - Lesson ${l.sort_order}: [${l.id}] ${l.title}`);
      const { data: acts } = await supabase
        .from('activities')
        .select('id, name, activity_type_id, config')
        .eq('lesson_id', l.id);
      acts.forEach(a => console.log(`    * Act: [${a.id}] ${a.name} (type: ${a.activity_type_id})`));
    }
  }
}

run().catch(console.error);
