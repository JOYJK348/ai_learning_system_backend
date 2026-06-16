const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  const { data: b } = await s.from('boards').select('id').eq('code', 'cbse').single();
  const { data: g } = await s.from('grades').select('id').eq('board_id', b.id).eq('code', 'lkg').single();
  const { data: sub } = await s.from('subjects').select('id').eq('grade_id', g.id).eq('code', 'english').single();

  const { data: chs } = await s.from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', sub.id)
    .is('deleted_at', null)
    .order('sort_order');

  for (const ch of chs) {
    const { data: ls } = await s.from('lessons')
      .select('id, title')
      .eq('chapter_id', ch.id)
      .is('deleted_at', null)
      .order('sort_order');

    console.log(ch.sort_order + '. ' + ch.name);
    for (const l of ls) {
      console.log('   -> ' + l.title);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
