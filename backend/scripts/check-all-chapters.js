const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI9MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);
(async () => {
  const { data: chapters } = await supabase.from('chapters')
    .select('id, name, sort_order, subject_id, grade_id')
    .is('deleted_at', null)
    .order('sort_order');

  const { data: grades } = await supabase.from('grades').select('id, name').is('deleted_at', null);
  const gradeMap = {};
  for (const g of grades || []) { gradeMap[g.id] = g.name; }

  const { data: subjects } = await supabase.from('subjects').select('id, name').is('deleted_at', null);
  const subjectMap = {};
  for (const s of subjects || []) { subjectMap[s.id] = s.name; }

  for (const c of chapters || []) {
    console.log(`  [${c.sort_order}] ${c.name} (id=${c.id.slice(0,8)}...) subj=${subjectMap[c.subject_id]||c.subject_id.slice(0,8)} grade=${gradeMap[c.grade_id]||c.grade_id.slice(0,8)}`);
  }
})();
