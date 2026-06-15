const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);
(async () => {
  const { data: chapters } = await supabase.from('chapters').select('id, name, sort_order').is('deleted_at', null).order('sort_order');
  console.log('All chapters:');
  for (const ch of chapters || []) {
    const { data: lessons } = await supabase.from('lessons').select('id, title').eq('chapter_id', ch.id).is('deleted_at', null);
    console.log(`  ${ch.sort_order}. ${ch.name} (${ch.id}) - ${lessons?.length || 0} lessons`);
    for (const l of lessons || []) console.log(`     - ${l.title} (${l.id})`);
  }
})();
