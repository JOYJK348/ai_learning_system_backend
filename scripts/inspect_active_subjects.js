const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

const activeSubjectIds = [
  '1c034546-e347-47f7-a8d6-8d26b914a0f3', // English
  '12ef940d-3566-40c1-a778-f892cf3c3392', // Mathematics
  '56fb0ca6-82cf-45b5-a5e6-234737863f5e', // Environmental Studies
  'e9a5c538-9b49-422c-9df8-e8f9add55fa5', // General Knowledge
  '28d30341-c023-4a0d-aeb8-bbb547d2e11b', // Hindi
  '14b9de26-756d-46fc-9c2f-292db2315f5a'  // Tamil
];

async function main() {
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .in('id', activeSubjectIds);

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, subject_id')
    .in('subject_id', activeSubjectIds)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  for (const s of subjects || []) {
    console.log(`\n========================================`);
    console.log(`SUBJECT: ${s.name} (ID: ${s.id})`);
    console.log(`========================================`);

    const sChaps = (chapters || []).filter(c => c.subject_id === s.id);
    for (const c of sChaps) {
      console.log(`  Chapter: "${c.name}" (ID: ${c.id})`);
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, sort_order')
        .eq('chapter_id', c.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });

      for (const l of lessons || []) {
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('id, title')
          .eq('lesson_id', l.id)
          .is('deleted_at', null)
          .maybeSingle();

        console.log(`    - Lesson: "${l.title}" | ID: ${l.id} | SortOrder: ${l.sort_order} | Quiz: ${quiz ? `"${quiz.title}" (ID: ${quiz.id})` : 'NONE'}`);
      }
    }
  }
}

main().catch(console.error);
