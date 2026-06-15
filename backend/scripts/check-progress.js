const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);
(async () => {
  const sid = '61f31c52-10f7-4ff2-8b6d-7803a2bb034b';
  const { data: pwChapter } = await supabase.from('chapters').select('id').eq('name', 'Pre-Writing Foundation').is('deleted_at', null).single();
  const { data: prChapter } = await supabase.from('chapters').select('id').eq('name', 'Pattern Readiness').is('deleted_at', null).single();
  const { data: ch1 } = await supabase.from('chapters').select('id, name').eq('name', 'Letters A-M').is('deleted_at', null).single();
  console.log('Chapters:', pwChapter?.id, prChapter?.id, ch1?.id);

  const { data: pwLessons } = await supabase.from('lessons').select('id, title').eq('chapter_id', pwChapter.id).is('deleted_at', null);
  const { data: prLessons } = await supabase.from('lessons').select('id, title').eq('chapter_id', prChapter.id).is('deleted_at', null);

  for (const l of [...(pwLessons||[]), ...(prLessons||[])]) {
    const { data: prog } = await supabase.from('lesson_progress').select('status, completion_percentage').eq('student_id', sid).eq('lesson_id', l.id).maybeSingle();
    console.log(l.title, prog ? `${prog.status} ${prog.completion_percentage}%` : 'NO PROGRESS');
  }
})();
