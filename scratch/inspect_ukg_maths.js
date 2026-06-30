const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
  });
} catch (e) {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Find UKG Maths subject
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, grade:grades(id, name)')
    .ilike('name', '%math%');
  
  console.log('Maths subjects:', JSON.stringify(subjects, null, 2));

  // Find existing UKG Maths chapters
  const ukgMaths = subjects?.find(s => s.grade?.name?.toUpperCase() === 'UKG');
  if (!ukgMaths) { console.log('No UKG Maths found'); return; }
  
  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, name, sort_order')
    .eq('subject_id', ukgMaths.id)
    .order('sort_order');
  
  console.log('\nUKG Maths subject ID:', ukgMaths.id);
  console.log('Existing chapters:', JSON.stringify(chapters, null, 2));
}
run().catch(console.error);
