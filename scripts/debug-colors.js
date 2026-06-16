const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  const { data: b } = await s.from('boards').select('id').eq('code', 'cbse').single();
  const { data: g } = await s.from('grades').select('id').eq('board_id', b.id).eq('code', 'lkg').single();
  const { data: sub } = await s.from('subjects').select('id').eq('grade_id', g.id).eq('code', 'english').single();

  const { data: ch } = await s.from('chapters')
    .select('id, name')
    .eq('subject_id', sub.id)
    .eq('name', 'Colors')
    .is('deleted_at', null)
    .single();

  console.log('Chapter:', ch.name, ch.id);

  const { data: lessons } = await s.from('lessons')
    .select('id, title')
    .eq('chapter_id', ch.id)
    .is('deleted_at', null);

  for (const l of lessons) {
    const { data: acts } = await s.from('activities')
      .select('id, name, activity_type_id')
      .eq('lesson_id', l.id)
      .is('deleted_at', null);
    console.log('\n' + l.title + ':');
    if (acts.length === 0) {
      console.log('   ⚠️ NO ACTIVITIES!');
    } else {
      acts.forEach(a => console.log('   - ' + a.name + ' (type: ' + a.activity_type_id + ')'));
    }
  }
}
main().catch(e => console.error(e));
