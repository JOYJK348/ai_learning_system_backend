const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const paths = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../.env.local')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim().replace(/\r/g, '');
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '').replace(/\r/g, '');
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  const { data: grade } = await supabase.from('grades').select('*').eq('name', 'UKG').maybeSingle();
  if (!grade) {
    console.error("UKG grade not found.");
    return;
  }
  console.log("UKG Grade ID:", grade.id);

  // Find English subject
  const { data: subject } = await supabase
    .from('subjects')
    .select('*')
    .eq('grade_id', grade.id)
    .ilike('name', '%english%')
    .maybeSingle();

  if (!subject) {
    console.log("No English subject found for UKG in database.");
    return;
  }
  console.log("English Subject:", subject);

  // Find chapters
  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('subject_id', subject.id)
    .order('sort_order', { ascending: true });

  console.log(`Found ${chapters.length} chapters:`);
  for (const ch of chapters) {
    console.log(`\nChapter: [${ch.sort_order}] ${ch.name} (ID: ${ch.id})`);
    
    // Find lessons
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .eq('chapter_id', ch.id)
      .order('sort_order', { ascending: true });

    for (const les of lessons) {
      console.log(`  - Lesson: [${les.sort_order}] ${les.title} (ID: ${les.id})`);
    }
  }
}

main().catch(console.error);
