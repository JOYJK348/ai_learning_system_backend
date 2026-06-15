const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);
(async () => {
  const sid = '61f31c52-10f7-4ff2-8b6d-7803a2bb034b';
  const { data: pwChapter } = await supabase.from('chapters').select('id').eq('name', 'Pre-Writing Foundation').is('deleted_at', null).single();
  const { data: lessons } = await supabase.from('lessons').select('id, title').eq('chapter_id', pwChapter.id).is('deleted_at', null);
  
  for (const l of lessons || []) {
    const { data: prog } = await supabase.from('lesson_progress').select('*').eq('student_id', sid).eq('lesson_id', l.id).maybeSingle();
    console.log(`${l.title} (${l.id}) -> ${prog ? prog.status : 'NO RECORD'}`);
  }

  const { data: allLP } = await supabase.from('lesson_progress').select('lesson_id, status').eq('student_id', sid);
  console.log('\nAll progress records:', allLP?.length || 0);
  for (const lp of allLP || []) {
    const { data: l } = await supabase.from('lessons').select('title').eq('id', lp.lesson_id).maybeSingle();
    console.log(`  ${lp.lesson_id} (${l?.title || '?'}): ${lp.status}`);
  }
})();
