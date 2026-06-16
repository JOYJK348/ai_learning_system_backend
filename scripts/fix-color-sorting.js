const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function main() {
  // Fix Color Sorting: drag_drop(2) → match(3) since it uses pairs format
  const { data: acts, error: qErr } = await s.from('activities')
    .select('id, name, activity_type_id')
    .eq('name', 'Color Sorting')
    .is('deleted_at', null);
  
  if (qErr) { console.error('Query error:', qErr.message); return; }
  console.log('Color Sorting:', JSON.stringify(acts));

  if (acts && acts.length > 0) {
    const { error } = await s.from('activities')
      .update({ activity_type_id: 3 })
      .eq('id', acts[0].id);
    console.log('Update:', error ? 'ERR ' + error.message : '✅ Color Sorting → match type');
  }

  // Show all activities in Colors chapter to verify
  const { data: board } = await s.from('boards').select('id').eq('code', 'cbse').single();
  const { data: grade } = await s.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').single();
  const { data: subject } = await s.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'english').single();
  const { data: ch } = await s.from('chapters').select('id').eq('subject_id', subject.id).eq('name', 'Colors').is('deleted_at', null).single();
  
  const { data: lessons } = await s.from('lessons').select('id, title').eq('chapter_id', ch.id).is('deleted_at', null);
  console.log('\nColors chapter activities:');
  for (const l of lessons || []) {
    const { data: activities } = await s.from('activities')
      .select('name, activity_type_id')
      .eq('lesson_id', l.id)
      .is('deleted_at', null)
      .order('sort_order');
    console.log(` ${l.title}:`);
    for (const a of activities || []) {
      console.log(`   ${a.name} → type ${a.activity_type_id}`);
    }
  }
}

main().catch(e => console.error(e));
