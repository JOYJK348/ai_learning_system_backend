const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);
(async () => {
  const chaptersOfInterest = ['Pre-Writing Foundation', 'Pattern Readiness', 'Chapter 1: Letters A-M', 'Alphabets & Phonics', 'Chapter 1: Alphabets', 'Reading Comprehension', 'Grammar Basics'];
  const { data: chapters } = await supabase.from('chapters')
    .select('id, name, sort_order, subject_id, grade_id')
    .is('deleted_at', null)
    .in('name', chaptersOfInterest);
  console.log('Chapters with grades:');
  for (const c of chapters || []) {
    const { data: grade } = await supabase.from('grades').select('name').eq('id', c.grade_id).maybeSingle();
    console.log(`  [${c.sort_order}] ${c.name} -> subject=${c.subject_id}, grade=${grade?.name || c.grade_id}`);
  }
})();
