const { createClient } = require('@supabase/supabase-js');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';
const supabase = createClient('https://nrwbwmhrbjmexxnejpbg.supabase.co', key);

async function run() {
  const email = 'joyjk348@gmail.com';

  console.log('Resetting registration and auth for:', email);

  // 1. Get Parent Registration ID
  const { data: reg } = await supabase
    .from('parent_registrations')
    .select('id')
    .eq('parent_email', email)
    .maybeSingle();

  if (!reg) {
    console.log('No registration found for:', email);
    return;
  }

  // 2. Find parent record in parents table
  const { data: parent } = await supabase
    .from('parents')
    .select('id, auth_user_id')
    .eq('email', email)
    .maybeSingle();

  if (parent) {
    // Find students linked to this parent
    const { data: links } = await supabase
      .from('parent_student_links')
      .select('student_id')
      .eq('parent_id', parent.id);

    const studentIds = (links || []).map(l => l.student_id);

    // Get auth_user_ids of students
    let studentAuthIds = [];
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('auth_user_id')
        .in('id', studentIds);
      studentAuthIds = (students || []).map(s => s.auth_user_id).filter(Boolean);
    }

    // Delete parent_student_links
    await supabase.from('parent_student_links').delete().eq('parent_id', parent.id);

    // Delete student records
    if (studentIds.length > 0) {
      await supabase.from('students').delete().in('id', studentIds);
    }

    // Delete parent record
    await supabase.from('parents').delete().eq('id', parent.id);

    // Delete Auth users
    if (parent.auth_user_id) {
      await supabase.auth.admin.deleteUser(parent.auth_user_id).catch(e => console.error(e));
    }
    for (const authId of studentAuthIds) {
      await supabase.auth.admin.deleteUser(authId).catch(e => console.error(e));
    }
  }

  // 3. Delete parent registration completely
  const { error: resetErr } = await supabase
    .from('parent_registrations')
    .delete()
    .eq('id', reg.id);

  if (resetErr) {
    console.error('Failed to delete parent registration:', resetErr);
  } else {
    console.log('Successfully deleted parent registration completely!');
  }
}

run();
