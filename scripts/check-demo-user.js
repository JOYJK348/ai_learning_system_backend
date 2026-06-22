const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0');

async function main() {
  const { data: students } = await supabase.from('students').select('*').eq('email', 'demo1@zhi.sg');
  const { data: parents } = await supabase.from('parents').select('*').eq('email', 'demo1@zhi.sg');
  const { data: admins } = await supabase.from('admins').select('*').eq('email', 'demo1@zhi.sg');
  const { data: schoolAdmins } = await supabase.from('school_admins').select('*').eq('email', 'demo1@zhi.sg');

  console.log('Students:', students);
  console.log('Parents:', parents);
  console.log('Admins:', admins);
  console.log('School Admins:', schoolAdmins);
}
main();
