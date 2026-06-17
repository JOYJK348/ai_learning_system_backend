const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  const { data: b } = await s.from('boards').select('id').eq('code', 'cbse').single();
  const { data: g } = await s.from('grades').select('id').eq('board_id', b.id).eq('code', 'lkg').single();
  const { data: sub } = await s.from('subjects').select('id').eq('grade_id', g.id).eq('code', 'tamil').single();

  if (!sub) { console.log('Tamil subject not found!'); return; }
  console.log('Tamil subject ID:', sub.id);

  const { data: chs } = await s.from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', sub.id)
    .is('deleted_at', null)
    .order('sort_order');

  console.log('Total chapters:', chs?.length || 0);

  for (const ch of chs || []) {
    const { data: ls } = await s.from('lessons')
      .select('id, title')
      .eq('chapter_id', ch.id)
      .is('deleted_at', null);
    console.log('\n' + ch.sort_order + '. ' + ch.name);
    if (!ls || ls.length === 0) {
      console.log('   NO LESSONS');
      continue;
    }
    for (const l of ls) {
      const { data: acts } = await s.from('activities')
        .select('id, name, activity_type_id')
        .eq('lesson_id', l.id)
        .is('deleted_at', null);
      console.log('   -> ' + l.title + ' (' + (acts?.length || 0) + ' activities)');
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
