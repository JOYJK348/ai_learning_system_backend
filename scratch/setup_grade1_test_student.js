const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(supabaseUrl, serviceRoleKey);
const grade1Id = '807cf7be-c596-4fd6-8b6e-ee991ca661a8';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function run() {
  console.log('Setting up Grade 1 test parent and student...');

  let user;
  try {
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: 'allaccess@zhi.com',
      password: 'password123',
      email_confirm: true
    });
    if (authErr) throw authErr;
    user = authUser?.user;
  } catch (err) {
    console.log('User allaccess@zhi.com already exists, listing users...');
    const { data: users } = await supabase.auth.admin.listUsers();
    user = users.users.find(u => u.email === 'allaccess@zhi.com');
  }

  if (!user) {
    console.error('Failed to create/get auth user');
    return;
  }
  console.log('Auth user ID:', user.id);

  // 2. Ensure parent record exists in parents table
  let { data: parent } = await supabase
    .from('parents')
    .select('id')
    .eq('email', 'allaccess@zhi.com')
    .maybeSingle();

  if (!parent) {
    const { data: newParent, error: parentErr } = await supabase
      .from('parents')
      .insert({
        id: user.id, // match auth user id
        name: 'All Access Parent',
        email: 'allaccess@zhi.com',
        phone: '9555222111',
        plan_type_id: 2, // Premium plan
        plan_status_id: 1,
        plan_started_at: new Date().toISOString(),
        plan_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (parentErr) {
      console.error('Error inserting parent:', parentErr);
      return;
    }
    parent = newParent;
  }
  console.log('Parent profile ID:', parent.id);

  // 3. Create a Grade 1 student record
  const studentId = uuidv4();
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert({
      id: studentId,
      full_name: 'Grade1 Explorer',
      grade_id: grade1Id,
      overall_progress: 0,
      total_lessons_completed: 0,
      total_quizzes_attempted: 0,
      total_quizzes_passed: 0,
      total_stars_earned: 0,
      total_badges_earned: 0,
      current_streak_days: 1
    })
    .select()
    .single();

  if (studentErr) {
    console.error('Error creating student:', studentErr);
    return;
  }
  console.log('Created Grade 1 student:', student.id, student.full_name);

  // 4. Link student to parent
  const { data: link, error: linkErr } = await supabase
    .from('parent_student_links')
    .insert({
      id: uuidv4(),
      parent_id: parent.id,
      student_id: student.id,
      is_primary: true
    })
    .select()
    .single();

  if (linkErr) {
    console.error('Error linking parent to student:', linkErr);
    return;
  }
  console.log('Successfully linked parent to Grade 1 student! Link ID:', link.id);

  // Let's set metadata on parent's auth user to mark role = 'parent' if not present
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { role: 'parent', profile_id: parent.id }
  });

  // Let's create a student user account so the student can log in directly if needed
  try {
    await supabase.auth.admin.createUser({
      email: 'grade1student@zhi.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'student', profile_id: studentId }
    });
  } catch (e) {
    // ignore if already registered
  }

  console.log('Grade 1 student login details: email: grade1student@zhi.com, password: password123');
}

run().catch(console.error);
