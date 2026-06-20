const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
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
    const english = subjects.find(s => s.grade_id === lkg.id && (s.code === 'english' || s.name.toLowerCase().includes('english')));
    if (!english) {
      console.log('English subject not found for LKG');
      return;
    }
    console.log('English Subject ID:', english.id);

    const { data: chapters } = await supabase.from('chapters')
      .select('id, name, sort_order')
      .eq('subject_id', english.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    console.log('--- English Chapters ---');
    for (const ch of chapters) {
      console.log(`Chapter: ${ch.name} (ID: ${ch.id})`);
    }
  } catch (err) {
    console.error('Error:', err);
  }
})();
