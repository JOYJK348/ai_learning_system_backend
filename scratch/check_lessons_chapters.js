const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select(`
      id,
      title,
      chapter:chapters (
        id,
        name,
        subject:subjects (
          id,
          name,
          grade:grades (
            name
          )
        )
      )
    `)
    .in('title', ['Above / Below & Left / Right', 'Front / Behind & Near / Far']);

  console.log('Lessons:', JSON.stringify(lessons, null, 2));
}

run();
