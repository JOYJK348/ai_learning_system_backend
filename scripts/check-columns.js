const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function check() {
  const { data: reg, error: regErr } = await supabase.from('parent_registrations').select('*').limit(1);
  console.log('parent_registrations row:', reg ? Object.keys(reg[0] || {}) : null);
  console.log('parent_registrations error:', regErr);

  const { data: stud, error: studErr } = await supabase.from('students').select('*').limit(1);
  console.log('students row:', stud ? Object.keys(stud[0] || {}) : null);
  console.log('students error:', studErr);
}

check();
