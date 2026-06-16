const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  const { data: board } = await s.from('boards').select('id').eq('code', 'cbse').single();
  const { data: grade } = await s.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').single();
  const { data: subject } = await s.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'english').single();

  // Get Colors chapter
  const { data: ch } = await s.from('chapters').select('id').eq('subject_id', subject.id).eq('name', 'Colors').is('deleted_at', null).single();
  
  // Get first lesson
  const { data: ls } = await s.from('lessons').select('id, title').eq('chapter_id', ch.id).is('deleted_at', null).order('sort_order');
  
  for (const l of ls) {
    console.log(`\n📘 ${l.title}:`);
    const { data: acts } = await s.from('activities').select('id, name, activity_type_id, config').eq('lesson_id', l.id).is('deleted_at', null).order('sort_order');
    for (const a of acts) {
      console.log(`  🔹 ${a.name} (type: ${a.activity_type_id})`);
      console.log(`     config: ${JSON.stringify(a.config)}`);
    }
  }
}
main().catch(e => console.error(e));
