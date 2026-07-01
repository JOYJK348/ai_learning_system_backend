const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const englishSubjectId = 'bd0b4df6-6f2e-478f-ad4e-c5edd23447ca';

async function run() {
  const { data: chapters, error } = await supabase
    .from('chapters')
    .select(`
      id,
      name,
      lessons (
        id,
        title
      )
    `)
    .eq('subject_id', englishSubjectId);

  if (error) {
    console.error(error);
    return;
  }

  console.log('Chapters & Lessons in DB for Grade 1 English:', JSON.stringify(chapters, null, 2));
}

run();
