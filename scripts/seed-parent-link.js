const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PARENT_EMAIL = 'lkgallp@zhi.com';
const PARENT_PASSWORD = 'P@123';
const STUDENT_EMAIL = 'allaccess@zhi.com';

async function main() {
  console.log('=== Linking Parent to Student ===');

  // 1. Find Student
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .select('id, full_name')
    .eq('email', STUDENT_EMAIL)
    .maybeSingle();

  if (studentErr || !student) {
    throw new Error('Student allaccess@zhi.com not found: ' + (studentErr?.message || 'Not found'));
  }
  console.log(`Found student: ${student.full_name} (${student.id})`);

  // 2. Fetch lookups
  const { data: activeStatus } = await supabase
    .from('lookup_entity_status')
    .select('id')
    .eq('code', 'active')
    .maybeSingle();
  if (!activeStatus) throw new Error('active status not found');

  const { data: approvedStatus } = await supabase
    .from('lookup_approval_status')
    .select('id')
    .eq('code', 'approved')
    .maybeSingle();
  if (!approvedStatus) throw new Error('approved status not found');

  const { data: freePlan } = await supabase
    .from('lookup_plan_types')
    .select('id')
    .eq('code', 'free')
    .maybeSingle();
  if (!freePlan) throw new Error('free plan type not found');

  const { data: activePlanStatus } = await supabase
    .from('lookup_plan_status')
    .select('id')
    .eq('code', 'active')
    .maybeSingle();
  if (!activePlanStatus) throw new Error('active plan status not found');

  // 3. Create or Check Parent
  let parentId;
  let authUserId;

  const { data: existingParent } = await supabase
    .from('parents')
    .select('id, auth_user_id')
    .eq('email', PARENT_EMAIL)
    .maybeSingle();

  if (existingParent) {
    console.log('Parent already exists in database');
    parentId = existingParent.id;
    authUserId = existingParent.auth_user_id;
  } else {
    console.log('Creating new parent auth user...');
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: PARENT_EMAIL,
      password: PARENT_PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'parent', name: 'LKG Parent' }
    });

    if (authErr) throw new Error('Auth create failed: ' + authErr.message);
    authUserId = authUser.user.id;
    console.log('Auth parent created:', authUserId);

    const { data: newParent, error: parentInsertErr } = await supabase
      .from('parents')
      .insert({
        auth_user_id: authUserId,
        email: PARENT_EMAIL,
        name: 'LKG Parent',
        registration_type: 'individual',
        plan_type_id: freePlan.id,
        plan_status_id: activePlanStatus.id,
        approval_status_id: approvedStatus.id,
        status_id: activeStatus.id
      })
      .select('id')
      .maybeSingle();

    if (parentInsertErr || !newParent) {
      await supabase.auth.admin.deleteUser(authUserId);
      throw new Error('Parent insert failed: ' + (parentInsertErr?.message || 'unknown'));
    }

    parentId = newParent.id;
    console.log('Parent record created:', parentId);
  }

  // 4. Link Parent to Student
  const { data: existingLink } = await supabase
    .from('parent_student_links')
    .select('id')
    .eq('parent_id', parentId)
    .eq('student_id', student.id)
    .maybeSingle();

  if (existingLink) {
    console.log('Parent and student are already linked!');
  } else {
    console.log('Linking parent and student...');
    const { error: linkErr } = await supabase
      .from('parent_student_links')
      .insert({
        parent_id: parentId,
        student_id: student.id,
        is_primary: true
      });

    if (linkErr) throw new Error('Linking failed: ' + linkErr.message);
    console.log('Successfully linked parent and student!');
  }

  console.log('=== SEED SUCCESSFUL ===');
  console.log(`Parent: ${PARENT_EMAIL} / ${PARENT_PASSWORD}`);
  console.log(`Linked Student: ${STUDENT_EMAIL}`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
