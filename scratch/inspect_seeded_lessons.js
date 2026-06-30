const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) process.env[parts[0].trim()] = process.env[parts[0].trim()] || parts.slice(1).join('=').trim();
  });
} catch (e) {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('subject_id', '7a0e45b8-95a5-4ece-99bd-1a6b2ba8fb9a');

  const chapIds = chapters.map(c => c.id);

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, chapter_id')
    .in('chapter_id', chapIds)
    .order('sort_order');

  console.log('Seeded UKG Maths Lessons:');
  lessons.forEach(l => {
    const chap = chapters.find(c => c.id === l.chapter_id);
    console.log(`- Chapter: "${chap.name}" | Lesson Title: "${l.title}"`);
  });
}
run().catch(console.error);
