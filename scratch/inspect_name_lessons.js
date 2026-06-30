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
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, chapters(name, subject:subjects(name, grade:grades(name)))')
    .ilike('title', '%name%');

  console.log('Lessons with "name" in title:');
  lessons.forEach(l => {
    console.log(`- ID: ${l.id} | Title: "${l.title}" | Subject: "${l.chapters?.subject?.name}" | Grade: "${l.chapters?.subject?.grade?.name}"`);
  });
}
run().catch(console.error);
