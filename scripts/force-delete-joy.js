const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function clean() {
  const email = 'joyjk348@gmail.com';
  console.log('Force deleting all records for:', email);

  // 1. Delete parent_registrations
  const { data: pr } = await supabase.from('parent_registrations').delete().eq('parent_email', email);
  console.log('Deleted parent_registrations:', pr);

  // 2. Delete school_registrations
  const { data: sr } = await supabase.from('school_registrations').delete().eq('admin_email', email);
  console.log('Deleted school_registrations:', sr);

  // 3. Find parent ID in parents table
  const { data: parent } = await supabase.from('parents').select('id, auth_user_id').eq('email', email).maybeSingle();
  if (parent) {
    // Delete links
    await supabase.from('parent_student_links').delete().eq('parent_id', parent.id);
    // Delete parent
    await supabase.from('parents').delete().eq('id', parent.id);
    console.log('Deleted parent profile:', parent.id);
  }

  // 4. Find school admin profile
  const { data: sa } = await supabase.from('school_admins').select('id, auth_user_id').eq('email', email).maybeSingle();
  if (sa) {
    await supabase.from('school_admins').delete().eq('id', sa.id);
    console.log('Deleted school admin profile:', sa.id);
  }

  // 5. Delete Auth Users
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const matchedUser = authUsers?.users?.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  if (matchedUser) {
    await supabase.auth.admin.deleteUser(matchedUser.id);
    console.log('Deleted user from Supabase Auth:', matchedUser.id);
  }

  // Double check paginated users
  let page = 1;
  while (true) {
    const { data: pagedData } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    const usersList = pagedData?.users || [];
    if (usersList.length === 0) break;
    const userToDel = usersList.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (userToDel) {
      await supabase.auth.admin.deleteUser(userToDel.id);
      console.log('Deleted user on page', page, ':', userToDel.id);
    }
    page++;
  }

  console.log('Cleanup finished!');
}

clean();
