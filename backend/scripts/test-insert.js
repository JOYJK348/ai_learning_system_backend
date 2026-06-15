const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);
(async () => {
  const sid = '61f31c52-10f7-4ff2-8b6d-7803a2bb034b';
  const sleepingLineId = '2f36737f-0ff7-466b-aa5f-d2e6ebf640c3';

  // Try direct insert
  const { data: ins, error: insErr } = await supabase.from('lesson_progress').insert({
    student_id: sid, lesson_id: sleepingLineId,
    status: 'completed', completion_percentage: 100,
    completed_at: new Date().toISOString(), last_accessed_at: new Date().toISOString()
  }).select();
  console.log('Insert error:', insErr?.message || 'OK');
  console.log('Insert data:', JSON.stringify(ins));

  // Check if it now exists
  const { data: check } = await supabase.from('lesson_progress').select('*')
    .eq('student_id', sid).eq('lesson_id', sleepingLineId).maybeSingle();
  console.log('Check:', check ? check.status : 'NOT FOUND');
})();
