const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  // Let's get progress for Kuttyma UKG (87209b5e-8925-4e80-b408-7005d0f40a4c)
  const { data: progress, error: err1 } = await supabase
    .from('lesson_progress')
    .select('id,status,completion_percentage,lesson:lessons(title)')
    .eq('student_id', '87209b5e-8925-4e80-b408-7005d0f40a4c');

  if (err1) console.error(err1);
  else console.log('Kuttyma UKG Progress count:', progress ? progress.length : 0, 'completed count:', progress ? progress.filter(p => p.status === 'completed').length : 0);

  // Let's see who Kuttyma UKG is linked to
  const { data: links, error: err2 } = await supabase
    .from('parent_student_links')
    .select('parent:parents(name,email),is_primary')
    .eq('student_id', '87209b5e-8925-4e80-b408-7005d0f40a4c');

  if (err2) console.error(err2);
  else console.log('Kuttyma UKG parent links:', JSON.stringify(links, null, 2));

  // Let's also see what student the parent "LKG Parentt" is logged in as, or what profile they are viewing
  // The user profile in parent dashboard:
  // "kuttyma" (ID: "5385637c-2e24-4a0e-aae7-2016148f3c7b") is linked to parent "LKG Parentt" (email: "lkgallp@zhi.com")
}

run();
