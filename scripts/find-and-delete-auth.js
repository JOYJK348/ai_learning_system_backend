const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function run() {
  const targetEmail = 'joyautomations.system@gmail.com'.toLowerCase();
  let page = 1;
  let found = false;

  while (true) {
    console.log(`Searching page ${page}...`);
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: 100
    });

    if (error) {
      console.error('Error listing users:', error);
      break;
    }

    const users = data?.users || [];
    if (users.length === 0) {
      console.log('No more users in auth list.');
      break;
    }

    const user = users.find(u => u.email && u.email.toLowerCase() === targetEmail);
    if (user) {
      console.log('Found user on page', page, 'with ID:', user.id);
      const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.error('Error deleting user:', delErr);
      } else {
        console.log('Successfully deleted user from Supabase Auth!');
      }
      found = true;
      break;
    }

    page++;
  }

  if (!found) {
    console.log('User not found in auth pages.');
  }

  // Set parent registration back to pending
  const { data: reg } = await supabase
    .from('parent_registrations')
    .select('id')
    .eq('parent_email', targetEmail)
    .maybeSingle();

  if (reg) {
    await supabase
      .from('parent_registrations')
      .update({ status: 'pending', approved_by: null, approved_at: null })
      .eq('id', reg.id);
    console.log('Reset registration back to pending for testing!');
  }
}

run();
