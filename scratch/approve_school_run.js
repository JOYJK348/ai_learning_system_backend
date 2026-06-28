const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nrwbwmhrbjmexxnejpbg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

function generateSchoolPassword(schoolName) {
  const clean = schoolName.replace(/[^a-zA-Z]/g, "");
  const prefix = clean.slice(0, 4);
  const capitalized = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
  return `Zhi@${capitalized}2026`;
}

function generateSchoolCode(schoolName) {
  const clean = schoolName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = clean.slice(0, 4).padEnd(4, "X");
  const rand = Math.floor(100 + Math.random() * 900);
  return `ZHI-${prefix}-${rand}`;
}

async function run() {
  const regId = '3374d518-f423-45ba-8cc1-418433dd67f0';
  console.log(`Approving registration ID: ${regId}`);

  try {
    const { data: reg, error: regError } = await supabaseAdmin
      .from("school_registrations")
      .select("*")
      .eq("id", regId)
      .single();

    if (regError || !reg) {
      console.error("School registration not found:", regError);
      return;
    }

    console.log("Found registration:", reg.school_name);

    const adminPass = generateSchoolPassword(reg.school_name);
    const schoolCode = generateSchoolCode(reg.school_name);
    const cleanSchoolPrefix = schoolCode.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const adminEmail = `admin.${cleanSchoolPrefix}@zhi.app`;

    const activeStatusId = 1;
    const schoolPlanTypeId = 3;
    const activePlanStatusId = 1;
    const schoolAdminRoleId = 3;

    console.log("Creating school record...");
    const { data: schoolRec, error: schoolErr } = await supabaseAdmin
      .from("schools")
      .insert({
        name: reg.school_name,
        code: schoolCode,
        address: reg.address || null,
        city: reg.city || null,
        phone: reg.admin_phone || null,
        email: reg.admin_email,
        principal_name: reg.admin_name,
        principal_phone: reg.admin_phone || null,
        plan_type_id: schoolPlanTypeId,
        plan_status_id: activePlanStatusId,
        plan_started_at: new Date().toISOString(),
        status_id: activeStatusId,
      })
      .select("id")
      .single();

    if (schoolErr || !schoolRec) {
      console.error("Failed to create school record:", schoolErr);
      return;
    }
    console.log("School record created:", schoolRec.id);

    console.log("Creating auth user...");
    const { data: adminAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPass,
      email_confirm: true,
      user_metadata: { role: "school_admin", name: reg.admin_name },
    });

    if (authErr || !adminAuth?.user) {
      console.error("Failed to create school admin auth user:", authErr);
      await supabaseAdmin.from("schools").delete().eq("id", schoolRec.id);
      return;
    }
    console.log("Auth user created:", adminAuth.user.id);

    console.log("Creating school admin profile...");
    const { error: profileErr } = await supabaseAdmin
      .from("school_admins")
      .insert({
        auth_user_id: adminAuth.user.id,
        school_id: schoolRec.id,
        email: reg.admin_email,
        name: reg.admin_name,
        role_id: schoolAdminRoleId,
        phone: reg.admin_phone || null,
        status_id: activeStatusId,
      });

    if (profileErr) {
      console.error("Failed to create school admin profile:", profileErr);
      await supabaseAdmin.auth.admin.deleteUser(adminAuth.user.id);
      await supabaseAdmin.from("schools").delete().eq("id", schoolRec.id);
      return;
    }
    console.log("Profile record created.");

    console.log("Updating registration status...");
    const { error: regUpdateErr } = await supabaseAdmin
      .from("school_registrations")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", regId);

    if (regUpdateErr) {
      console.error("Failed to update registration status:", regUpdateErr);
      return;
    }
    console.log("Registration status updated to approved!");

    console.log("Sending email...");
    const { sendSchoolWelcomeEmail } = require('../src/lib/email.ts'); // Wait, email.ts might use ES modules, so let's import manually or send it directly.
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
