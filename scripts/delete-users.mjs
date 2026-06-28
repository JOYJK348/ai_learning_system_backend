import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nrwbwmhrbjmexxnejpbg.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const EMAILS = [
  "bharathidev20@gmail.com",
  "aarthika0@gmail.com",
  "jayakumarjunefirst@gmail.com",
  "jayakumarfirstjune@gmail.com"
];

async function hardDelete(table, column, value) {
  const cleanValue = value.toLowerCase();
  console.log(`  Checking ${table} WHERE ${column} = ${cleanValue}`);

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id, deleted_at")
    .eq(column, cleanValue);

  if (error) {
    console.error(`  ✗ Error querying ${table}: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    console.log(`  - Not found in ${table}`);
    return;
  }

  for (const row of data) {
    const { error: delErr } = await supabaseAdmin
      .from(table)
      .delete()
      .eq("id", row.id);
    if (delErr) {
      console.error(`  ✗ Failed to delete ${table} id=${row.id}: ${delErr.message}`);
    } else {
      console.log(`  ✓ Hard-deleted from ${table} id=${row.id}`);
    }
  }
}

async function findAndDeleteAuthUser(email) {
  const cleanEmail = email.toLowerCase();

  // Try to get user directly from auth admin API
  // First try by looking through all users (limited pagination)
  let page = 0;
  let found = false;
  while (!found) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000
    });
    if (error) {
      console.error(`  ✗ Error listing auth users: ${error.message}`);
      break;
    }
    if (!data?.users || data.users.length === 0) break;

    const user = data.users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (user) {
      const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (delErr) {
        console.error(`  ✗ Failed to delete auth user ${user.id}: ${delErr.message}`);
      } else {
        console.log(`  ✓ Deleted from Supabase Auth: ${user.id} (${user.email})`);
      }
      found = true;
      break;
    }
    page++;
    if (page > 10) break; // safety limit
  }

  if (!found) {
    console.log(`  - Not found in Supabase Auth`);
  }
}

async function main() {
  console.log("======================================");
  console.log("FULL HARD DELETION - All 4 emails");
  console.log("======================================");

  for (const email of EMAILS) {
    console.log(`\n========== Processing: ${email} ==========`);

    await hardDelete("school_registrations", "admin_email", email);
    await hardDelete("parent_registrations", "parent_email", email);
    await hardDelete("parents", "email", email);
    await hardDelete("school_admins", "email", email);
    await hardDelete("admins", "email", email);
    await hardDelete("students", "email", email);
    await findAndDeleteAuthUser(email);
  }

  console.log("\n======================================");
  console.log("VERIFICATION - Checking remaining records");
  console.log("======================================");

  for (const email of EMAILS) {
    const cleanEmail = email.toLowerCase();
    let hasRemaining = false;

    const checks = [
      { table: "school_registrations", column: "admin_email" },
      { table: "parent_registrations", column: "parent_email" },
      { table: "parents", column: "email" },
      { table: "school_admins", column: "email" },
      { table: "admins", column: "email" },
      { table: "students", column: "email" }
    ];

    for (const { table, column } of checks) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select("id, deleted_at")
        .eq(column, cleanEmail);

      if (error) {
        console.error(`  Error verifying ${table}: ${error.message}`);
      } else if (data && data.length > 0) {
        hasRemaining = true;
        for (const row of data) {
          const delStatus = row.deleted_at ? `(soft-deleted: ${row.deleted_at})` : "(NOT DELETED!)";
          console.log(`  ⚠ ${email} still in ${table} id=${row.id} ${delStatus}`);
        }
      }
    }

    if (!hasRemaining) {
      console.log(`  ✅ ${email} - completely removed from all tables`);
    }
  }

  // Also check auth users
  console.log("\n--- Checking Supabase Auth ---");
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
  if (authData?.users) {
    for (const email of EMAILS) {
      const user = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (user) {
        console.log(`  ⚠ ${email} still in Supabase Auth: ${user.id}`);
      } else {
        console.log(`  ✅ ${email} - removed from Supabase Auth`);
      }
    }
  }

  console.log("\n✅ All done. Try registering now!");
}

main().catch(console.error);
