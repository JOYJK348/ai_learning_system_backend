const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
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
    // 1. Get Grade LKG id
    const { data: grades } = await supabase.from('grades').select('id, name, code');
    const lkg = grades.find(g => g.code === 'lkg');
    if (!lkg) {
      console.log('LKG Grade not found');
      return;
    }
    console.log('LKG Grade ID:', lkg.id);

    // 2. Get Tamil Subject id for LKG
    const { data: subjects } = await supabase.from('subjects').select('id, name, code, grade_id');
    const tamil = subjects.find(s => s.grade_id === lkg.id && s.code === 'tamil');
    if (!tamil) {
      console.log('Tamil subject not found for LKG');
      return;
    }
    console.log('Tamil Subject ID:', tamil.id);

    // 3. Get Chapters and Lessons for Tamil
    const { data: chapters } = await supabase.from('chapters')
      .select('id, name, sort_order')
      .eq('subject_id', tamil.id)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (!chapters) {
      console.log('No chapters found');
      return;
    }

    console.log('--- Chapters and Lessons ---');
    for (const ch of chapters) {
      const { data: lessons } = await supabase.from('lessons')
        .select('id, title, sort_order')
        .eq('chapter_id', ch.id)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      
      console.log(`\nChapter: ${ch.name} (ID: ${ch.id})`);
      (lessons || []).forEach(l => {
        console.log(`  - Lesson: ${l.title} (ID: ${l.id})`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  }
})();
