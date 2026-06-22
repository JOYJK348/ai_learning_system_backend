const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = 'd:/FreeLance/AI-LearningPortal/backend/.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  try {
    const { data: grades } = await supabase.from('grades').select('id, name, code');
    const lkg = grades.find(g => g.code === 'lkg');
    if (!lkg) {
      console.log('LKG Grade not found');
      return;
    }

    const { data: subjects } = await supabase.from('subjects').select('id, name, code, grade_id');
    const math = subjects.find(s => s.grade_id === lkg.id && (s.code === 'math' || s.name.toLowerCase().includes('math') || s.name.toLowerCase().includes('pre-math') || s.name.toLowerCase().includes('mathematics')));
    if (!math) {
      console.log('Math subject not found for LKG');
      return;
    }
    console.log('Math Subject ID:', math.id, 'Name:', math.name);

    const { data: chapters } = await supabase.from('chapters')
      .select('id, name, sort_order')
      .eq('subject_id', math.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    console.log('--- Chapters and Lessons ---');
    for (const ch of chapters) {
      const { data: lessons } = await supabase.from('lessons')
        .select('id, title, sort_order')
        .eq('chapter_id', ch.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      
      console.log(`\nChapter: ${ch.name} (ID: ${ch.id})`);
      for (const l of (lessons || [])) {
        console.log(`  - Lesson: ${l.title} (ID: ${l.id})`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
})();
