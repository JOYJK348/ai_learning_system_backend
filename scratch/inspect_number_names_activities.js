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
    .select('id, title')
    .eq('title', 'Number Names (1-20)');

  if (!lessons || lessons.length === 0) {
    console.log('No lesson found with title "Number Names (1-20)"');
    return;
  }

  const lessonId = lessons[0].id;
  const { data: activities } = await supabase
    .from('activities')
    .select('id, name, activity_type_id, config')
    .eq('lesson_id', lessonId);

  console.log(`Lesson: "${lessons[0].title}" (ID: ${lessonId})`);
  console.log('Activities:', JSON.stringify(activities, null, 2));
}
run().catch(console.error);
