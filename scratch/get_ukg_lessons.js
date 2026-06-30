const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const subjectId = '12421f15-8c9f-41bf-8c99-38f501b27456'; // UKG Tamil

async function run() {
  const { data: chapters, error } = await supabase
    .from('chapters')
    .select(`
      id,
      name,
      sort_order,
      lessons (
        id,
        title,
        sort_order
      )
    `)
    .eq('subject_id', subjectId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching chapters:', error);
    return;
  }

  console.log(JSON.stringify(chapters, null, 2));
}

run();
