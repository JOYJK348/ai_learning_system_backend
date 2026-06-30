const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const ch7Id = '4b9dd215-5d10-4201-b57b-235c027f1a0e';
  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order')
    .eq('chapter_id', ch7Id)
    .order('sort_order', { ascending: true });
  console.log('\n--- Chapter 7 Lessons ---');
  lessons.forEach(l => console.log(`${l.sort_order}: [${l.id}] ${l.title}`));
}

run().catch(console.error);
