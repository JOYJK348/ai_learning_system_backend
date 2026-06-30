const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env file
function loadEnv() {
  const paths = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../.env.local'),
    path.join(__dirname, '../.env.production'),
    path.join(__dirname, '../.env.development')
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Supabase environment variables missing.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Service Key length:", supabaseServiceKey ? supabaseServiceKey.length : 0);
  console.log("Service Key prefix:", supabaseServiceKey ? supabaseServiceKey.slice(0, 15) : "none");

  const parentEmail = 'lkgallp@zhi.com';
  console.log(`Looking up parent: ${parentEmail}`);
  
  // Find parent profile
  const { data: parent, error: pErr } = await supabase
    .from('parents')
    .select('id, name, phone')
    .eq('email', parentEmail)
    .maybeSingle();

  if (pErr || !parent) {
    console.error("Parent not found in DB:", pErr?.message || "Not found");
    return;
  }
  
  console.log("Found Parent:", parent);

  // Find pending child link request
  const { data: requests, error: rErr } = await supabase
    .from('child_link_requests')
    .select('*')
    .eq('parent_id', parent.id)
    .eq('status', 'pending');

  if (rErr) {
    console.error("Error loading link requests:", rErr.message);
    return;
  }

  if (!requests || requests.length === 0) {
    console.log("No pending link requests found for this parent. Let's list already approved child links:");
    const { data: links } = await supabase
      .from('parent_student_links')
      .select('student_id, students(id, full_name, email)')
      .eq('parent_id', parent.id);
    console.log("Linked children profiles:", JSON.stringify(links, null, 2));
    return;
  }

  const req = requests[0];
  console.log("Found Link Request:", req);

  // Auto-approve
  const childPass = parent.phone && parent.phone.replace(/[^0-9]/g, "").length >= 6
    ? parent.phone.replace(/[^0-9]/g, "").slice(0, 6)
    : "123456"; // Default testing passcode

  const cleanChildFirstName = req.child_name.trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  const phoneDigits = String(parent.phone || "").replace(/[^0-9]/g, "");
  const lastFour = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : "8888";
  const childEmail = `${cleanChildFirstName}.${lastFour}@zhi.app`;

  console.log(`Generating Auth Account for: ${childEmail} / Pass: ${childPass}`);

  // Create auth user
  const { data: authUser, error: caErr } = await supabase.auth.admin.createUser({
    email: childEmail,
    password: childPass,
    email_confirm: true,
    user_metadata: { role: "student", name: req.child_name },
  });

  if (caErr && !caErr.message.includes("already exists")) {
    console.error("Failed to create auth user:", caErr.message);
    return;
  }

  let finalUserId = authUser?.user?.id;
  if (caErr && caErr.message.includes("already exists")) {
    console.log("User already exists in auth. Finding id...");
    // If user already exists, we can fetch them from auth (or we'll reuse)
  }

  // Get active status lookup id
  const { data: activeStatus } = await supabase
    .from('lookup_entity_status')
    .select('id')
    .eq('code', 'active')
    .maybeSingle();

  const statusId = activeStatus?.id || 1;

  // Insert profile
  const { data: studentRec, error: spErr } = await supabase
    .from('students')
    .insert({
      auth_user_id: finalUserId || null,
      full_name: req.child_name,
      grade_id: req.child_grade_id || null,
      gender: req.child_gender || null,
      date_of_birth: req.child_dob || null,
      status_id: statusId,
    })
    .select('id')
    .single();

  if (spErr) {
    console.error("Failed to insert student profile:", spErr.message);
    return;
  }

  // Link
  await supabase.from('parent_student_links').insert({
    parent_id: parent.id,
    student_id: studentRec.id,
    is_primary: false,
  });

  // Update request status
  await supabase
    .from('child_link_requests')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', req.id);

  console.log("=== APPROVED SUCCESSFULLY ===");
  console.log(`Email/Login: ${childEmail}`);
  console.log(`Password: ${childPass}`);
  console.log("=============================");
}

main().catch(console.error);
