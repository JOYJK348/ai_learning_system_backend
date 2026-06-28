const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      process.env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
} catch (e) {
  console.warn("Could not read .env file manually:", e.message);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  try {
    // 1. Find school ID for "JOY GARDEN"
    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .select('id, name')
      .ilike('name', '%JOY GARDEN%')
      .maybeSingle();

    if (schoolErr) throw schoolErr;
    if (!school) {
      console.error("School 'JOY GARDEN' not found.");
      return;
    }

    console.log(`Found School: ${school.name} (ID: ${school.id})`);

    // 2. Fetch all student profiles linked to this school (even soft-deleted ones)
    const { data: schoolStudents, error: ssErr } = await supabase
      .from('school_students')
      .select('student_id, student:students(auth_user_id, full_name)')
      .eq('school_id', school.id);

    if (ssErr) throw ssErr;
    if (!schoolStudents || schoolStudents.length === 0) {
      console.log("No students linked to this school.");
      return;
    }

    const studentIds = schoolStudents.map(ss => ss.student_id).filter(Boolean);
    const authUserIds = schoolStudents.map(ss => ss.student?.auth_user_id).filter(Boolean);

    console.log(`Found ${studentIds.length} linked student profiles.`);

    // 3. Delete parent-student links for these students
    if (studentIds.length > 0) {
      const { error: pslErr } = await supabase
        .from('parent_student_links')
        .delete()
        .in('student_id', studentIds);
      if (pslErr) console.warn("Warning deleting parent_student_links:", pslErr.message);
      else console.log("Deleted parent-student links.");
    }

    // 4. Delete term unlocks for these students
    if (studentIds.length > 0) {
      const { error: tuErr } = await supabase
        .from('term_unlocks')
        .delete()
        .in('student_id', studentIds);
      if (tuErr) console.warn("Warning deleting term_unlocks:", tuErr.message);
      else console.log("Deleted term unlocks.");
    }

    // 5. Delete school_students links
    if (studentIds.length > 0) {
      const { error: ssDelErr } = await supabase
        .from('school_students')
        .delete()
        .eq('school_id', school.id);
      if (ssDelErr) throw ssDelErr;
      console.log("Deleted school_students rows.");
    }

    // 6. Delete student records from students table
    if (studentIds.length > 0) {
      const { error: sDelErr } = await supabase
        .from('students')
        .delete()
        .in('id', studentIds);
      if (sDelErr) throw sDelErr;
      console.log("Deleted profiles from students table.");
    }

    // 7. Delete Auth users from Supabase Auth
    console.log("Deleting Auth users...");
    for (const authUserId of authUserIds) {
      const { error: authDelErr } = await supabase.auth.admin.deleteUser(authUserId);
      if (authDelErr) {
        console.warn(`Failed to delete auth user ${authUserId}: ${authDelErr.message}`);
      } else {
        console.log(`Deleted auth user: ${authUserId}`);
      }
    }

    console.log("All student data cleared successfully for JOY GARDEN!");
  } catch (err) {
    console.error("Execution failed:", err.message || err);
  }
}

run();
