const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const email = 'joyjk348@gmail.com';
  console.log(`Starting cleanup for email: ${email}`);

  // 1. Find the user in supabase auth
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('Error listing auth users:', authError);
    return;
  }

  const authUser = users.find(u => u.email === email);
  let authUserId = null;
  if (authUser) {
    authUserId = authUser.id;
    console.log(`Found Auth User: ${authUserId}`);
  } else {
    console.log('No Auth User found.');
  }

  // 2. Find in public.parents
  const { data: parents, error: parentFindError } = await supabase
    .from('parents')
    .select('id, name')
    .eq('email', email);

  if (parentFindError) {
    console.warn('Error reading parents table:', parentFindError);
  }

  const parentIds = (parents || []).map(p => p.id);
  console.log(`Found parent IDs:`, parentIds);

  // 3. Delete dependent rows
  if (parentIds.length > 0) {
    // Delete child link requests
    const { error: clErr } = await supabase
      .from('child_link_requests')
      .delete()
      .in('parent_id', parentIds);
    if (clErr) console.warn('Error deleting child_link_requests:', clErr);
    else console.log('Cleaned child_link_requests.');

    // Delete student parent linkages or students if students are tied directly to parent
    // Let's check if students table has a parent_id
    const { error: studErr } = await supabase
      .from('students')
      .delete()
      .in('parent_id', parentIds);
    if (studErr) console.warn('Error deleting students directly tied to parents:', studErr);
    else console.log('Cleaned students tied to parent.');
  }

  // 4. Delete from public.parents
  const { error: pDeleteErr } = await supabase
    .from('parents')
    .delete()
    .eq('email', email);
  if (pDeleteErr) console.warn('Error deleting from parents:', pDeleteErr);
  else console.log('Deleted from public.parents.');

  // 5. Delete registration requests
  const { error: prDeleteErr } = await supabase
    .from('parent_registrations')
    .delete()
    .eq('parent_email', email);
  if (prDeleteErr) console.warn('Error deleting parent_registrations:', prDeleteErr);
  else console.log('Deleted parent_registrations.');

  const { error: srDeleteErr } = await supabase
    .from('school_registrations')
    .delete()
    .eq('admin_email', email);
  if (srDeleteErr) console.warn('Error deleting school_registrations:', srDeleteErr);
  else console.log('Deleted school_registrations.');

  // 6. Delete the Auth User
  if (authUserId) {
    const { error: authDelErr } = await supabase.auth.admin.deleteUser(authUserId);
    if (authDelErr) console.error('Error deleting auth user:', authDelErr);
    else console.log('Deleted Supabase Auth User.');
  }

  console.log('Cleanup complete!');
}

run();
