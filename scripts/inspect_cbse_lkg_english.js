const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: boards } = await supabase
    .from('boards')
    .select('id, name')
    .is('deleted_at', null);
  
  console.log('BOARDS:', boards);

  const { data: grades } = await supabase
    .from('grades')
    .select('id, name, board_id')
    .is('deleted_at', null);

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, grade_id')
    .is('deleted_at', null);

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, subject_id')
    .is('deleted_at', null);

  // Filter LKG CBSE English chapters
  const cbse = boards.find(b => b.name === 'CBSE');
  if (!cbse) return console.log('CBSE not found');

  const lkg = grades.find(g => g.name === 'LKG' && g.board_id === cbse.id);
  if (!lkg) return console.log('LKG not found under CBSE');

  const english = subjects.find(s => s.name === 'English' && s.grade_id === lkg.id);
  if (!english) return console.log('English subject not found for LKG CBSE');

  console.log(`LKG CBSE English Subject ID: ${english.id}`);

  const englishChapters = chapters.filter(c => c.subject_id === english.id);
  console.log('Chapters for LKG CBSE English:');
  for (const c of englishChapters) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title')
      .eq('chapter_id', c.id)
      .is('deleted_at', null);

    console.log(`- Chapter: "${c.name}" | ID: ${c.id}`);
    for (const l of lessons || []) {
      // Find quizzes for the lesson
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, title')
        .eq('lesson_id', l.id)
        .is('deleted_at', null);

      const qids = (quizzes || []).map(q => q.id);
      
      let qCount = 0;
      if (qids.length > 0) {
        const { data: questions } = await supabase
          .from('quiz_questions')
          .select('id')
          .in('quiz_id', qids)
          .is('deleted_at', null);
        qCount = questions?.length || 0;
      }

      console.log(`  * Lesson: "${l.title}" | ID: ${l.id} | Quizzes: ${quizzes?.map(q => q.title).join(', ') || 'NONE'} | Q Count: ${qCount}`);
    }
  }
}

main().catch(console.error);
