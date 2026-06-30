const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  console.log('Querying chapter "ஒலி & எழுத்து"...');
  
  const { data: chapters, error: qErr } = await supabase
    .from('chapters')
    .select('id, name')
    .eq('name', 'ஒலி & எழுத்து');

  if (qErr) {
    console.error('Error querying chapter:', qErr.message);
    return;
  }

  if (!chapters || chapters.length === 0) {
    console.log('Chapter "ஒலி & எழுத்து" not found in DB.');
    return;
  }

  const chapterId = chapters[0].id;
  console.log(`Found chapter ID: ${chapterId}. Deleting...`);

  // Cascade delete through DB references
  const { error: delErr } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId);

  if (delErr) {
    console.error('Error deleting chapter:', delErr.message);
  } else {
    console.log('✅ Successfully deleted chapter "ஒலி & எழுத்து" and all its lessons/activities from DB!');
  }
}

run().catch(console.error);
