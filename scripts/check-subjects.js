const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  const { data: b } = await s.from('boards').select('id').eq('code', 'cbse').single();
  const { data: g } = await s.from('grades').select('id').eq('board_id', b.id).eq('code', 'lkg').single();
  const { data: subs } = await s.from('subjects').select('id, code, name').eq('grade_id', g.id);
  
  console.log('LKG Subjects found:', subs?.length || 0);
  for (const sub of subs || []) {
    const { data: chs } = await s.from('chapters')
      .select('id, name')
      .eq('subject_id', sub.id)
      .is('deleted_at', null);
    console.log(`\n${sub.name} (${sub.code}) - ${chs?.length || 0} chapters`);
    if (chs?.length) {
      chs.forEach(c => console.log(`  - ${c.name}`));
    }
  }
}
main().catch(e => console.error(e));
