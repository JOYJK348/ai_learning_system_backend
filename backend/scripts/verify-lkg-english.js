const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nrwbwmhrbjmexxnejpbg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0'
);

async function verify() {
  const { data: board } = await supabase.from('boards').select('id').eq('code', 'cbse').single();
  const { data: grade } = await supabase.from('grades').select('id').eq('board_id', board.id).eq('code', 'lkg').single();
  const { data: subject } = await supabase.from('subjects').select('id').eq('grade_id', grade.id).eq('code', 'english').single();

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', subject.id)
    .is('deleted_at', null)
    .order('sort_order');

  console.log('=== LKG English Curriculum ===\n');
  console.log(`Chapters: ${chapters?.length || 0}\n`);

  for (const ch of chapters || []) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('title, sort_order')
      .eq('chapter_id', ch.id)
      .is('deleted_at', null)
      .order('sort_order');

    console.log(`📚 ${ch.name} (${lessons?.length || 0} lessons)`);
    for (const l of lessons || []) {
      console.log(`   └─ ${l.title}`);
    }
    console.log();
  }
}

verify().catch(console.error);
