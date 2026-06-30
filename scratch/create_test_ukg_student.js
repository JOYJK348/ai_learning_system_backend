const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const paths = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../.env.local')
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim().replace(/\r/g, '');
          const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '').replace(/\r/g, '');
          if (key && !process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  // 1. Find grade ID for UKG
  const { data: grade, error: gErr } = await supabase
    .from('grades')
    .select('id, name')
    .eq('name', 'UKG')
    .maybeSingle();

  if (gErr || !grade) {
    console.error("UKG Grade not found in database:", gErr?.message || "Not found");
    return;
  }
  console.log("Found UKG Grade in DB:", grade);

  const testEmail = 'kuttyma.test@zhi.app';
  const testPass = '123456';

  console.log(`Checking if auth user exists for: ${testEmail}`);

  // Delete existing test user if present to make it a clean script
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users?.users?.find(u => u.email === testEmail);
  if (existingUser) {
    console.log("Existing test user found. Deleting first...");
    await supabase.auth.admin.deleteUser(existingUser.id);
  }

  // 2. Create student auth account
  const { data: authUser, error: caErr } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPass,
    email_confirm: true,
    user_metadata: { role: 'student', name: 'Kuttyma UKG' },
  });

  if (caErr) {
    console.error("Failed to create auth user:", caErr.message);
    return;
  }

  console.log("Auth user created successfully. ID:", authUser.user.id);

  // Get active status lookup id
  const { data: activeStatus } = await supabase
    .from('lookup_entity_status')
    .select('id')
    .eq('code', 'active')
    .maybeSingle();

  const statusId = activeStatus?.id || 1;

  // 3. Create student profile record
  const { data: student, error: spErr } = await supabase
    .from('students')
    .insert({
      auth_user_id: authUser.user.id,
      full_name: 'Kuttyma UKG',
      grade_id: grade.id,
      status_id: statusId,
      overall_progress: 0,
    })
    .select('id')
    .single();

  if (spErr) {
    console.error("Failed to create student profile:", spErr.message);
    // clean up
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return;
  }

  console.log("=== UKG TEST ACCOUNT CREATED ===");
  console.log(`Email / Login: ${testEmail}`);
  console.log(`Password:      ${testPass}`);
  console.log(`Grade:         UKG`);
  console.log("=================================");
}

main().catch(console.error);
