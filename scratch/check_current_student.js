const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.development');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value.trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: students } = await supabase
    .from('students')
    .select('id, full_name, grade_id, grades(name)')
    .is('deleted_at', null);

  console.log('Students in database:');
  for (const s of students || []) {
    console.log(`- ${s.full_name} (${s.id}) grade: ${s.grades?.name}`);
  }
}

run().catch(console.error);
