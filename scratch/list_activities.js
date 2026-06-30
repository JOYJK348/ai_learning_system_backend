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
  // Lesson: Capital Letters A-Z
  const lessonId = 'e0b6e8a7-8f93-4dc2-a2af-b7125cfb6e73';
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .eq('lesson_id', lessonId);

  if (error) {
    console.error("Error loading activities:", error.message);
    return;
  }

  console.log("Activities for Capital Letters A-Z:", JSON.stringify(activities, null, 2));
}

main().catch(console.error);
