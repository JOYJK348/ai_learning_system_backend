const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);
(async () => {
  // Get subjects
  const { data: subjects } = await supabase.from('subjects').select('id, name').is('deleted_at', null);
  console.log('Subjects:');
  for (const s of subjects || []) {
    console.log(`  ${s.id}: ${s.name}`);
  }
  // Get chapters with subject info
  const { data: chapters } = await supabase.from('chapters')
    .select('id, name, sort_order, subject_id')
    .is('deleted_at', null)
    .order('sort_order');
  console.log('\nChapters:');
  for (const c of chapters || []) {
    const subj = subjects?.find(s => s.id === c.subject_id);
    const { data: lessons } = await supabase.from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('chapter_id', c.id)
      .is('deleted_at', null);
    console.log(`  [${c.sort_order}] ${c.name} (subj: ${subj?.name || c.subject_id}) - ${lessons?.length || 0} lessons`);
  }
})();
