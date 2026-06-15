const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);
(async () => {
  const sid = '61f31c52-10f7-4ff2-8b6d-7803a2bb034b';

  // Fix Sleeping Line (no record at all)
  await supabase.from('lesson_progress').insert({
    student_id: sid, lesson_id: '2f36737f-0ff7-466b-aa5f-d2e6ebf640c3',
    status: 'completed', completion_percentage: 100,
    completed_at: new Date().toISOString(), last_accessed_at: new Date().toISOString(),
  });
  console.log('✅ Sleeping Line done');

  // Fix Pattern Fun & Pattern Control - they have not_started records, need UPDATE
  const now = new Date().toISOString();
  for (const lessonId of ['8d53f289-4caa-47cc-9aca-6783ed1238ff', 'daf66b6b-6aa1-4c24-a635-06e477546503']) {
    // Delete existing not_started record
    await supabase.from('lesson_progress').delete()
      .eq('student_id', sid).eq('lesson_id', lessonId);
    // Insert fresh completed record
    await supabase.from('lesson_progress').insert({
      student_id: sid, lesson_id: lessonId,
      status: 'completed', completion_percentage: 100,
      completed_at: now, last_accessed_at: now,
    });
  }
  console.log('✅ Pattern Fun & Pattern Control done');

  // Verify
  const { data: pwChapter } = await supabase.from('chapters').select('id').eq('name', 'Pre-Writing Foundation').is('deleted_at', null).single();
  const { data: prChapter } = await supabase.from('chapters').select('id').eq('name', 'Pattern Readiness').is('deleted_at', null).single();
  const pwLessons = (await supabase.from('lessons').select('id, title').eq('chapter_id', pwChapter.id).is('deleted_at', null)).data;
  const prLessons = (await supabase.from('lessons').select('id, title').eq('chapter_id', prChapter.id).is('deleted_at', null)).data;

  for (const l of [...(pwLessons||[]), ...(prLessons||[])]) {
    const { data: p } = await supabase.from('lesson_progress').select('status, completion_percentage')
      .eq('student_id', sid).eq('lesson_id', l.id).maybeSingle();
    console.log(`  ${l.title}: ${p ? p.status + ' ' + p.completion_percentage + '%' : 'NO RECORD'}`);
  }
  console.log('\n✅ All done! Refresh the Learn page.');
})();
