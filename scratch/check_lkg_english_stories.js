const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: chapters, error } = await supabase
    .from('chapters')
    .select(`
      id,
      name,
      lessons (
        id,
        title,
        activities (
          id,
          name,
          activity_type_id
        )
      )
    `)
    .ilike('name', '%rhymes%')
    .order('name');

  console.log('Chapters matching rhymes:', JSON.stringify(chapters, null, 2));
}

run();
