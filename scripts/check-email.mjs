import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://nrwbwmhrbjmexxnejpbg.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yd2J3bWhyYmptZXh4bmVqcGJnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxMzk3MCwiZXhwIjoyMDk1OTg5OTcwfQ.5WWtNPhJAfBjNpP_gUFOqAl1Z6S34NzSDMY3C-z2QV0",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const EMAILS = [
  "bharathidev20@gmail.com",
  "aarthika0@gmail.com",
  "jayakumarjunefirst@gmail.com",
  "jayakumarfirstjune@gmail.com"
];

async function main() {
  for (const email of EMAILS) {
    console.log(`\n========== ${email} ==========`);
    const cleanEmail = email.toLowerCase();

    const checks = [
      { t: "school_registrations", c: "admin_email" },
      { t: "parent_registrations", c: "parent_email" },
      { t: "parents", c: "email" },
      { t: "school_admins", c: "email" },
      { t: "admins", c: "email" },
      { t: "students", c: "email" }
    ];

    let found = false;
    for (const { t, c } of checks) {
      const { data, error } = await supabaseAdmin.from(t).select("id, deleted_at").eq(c, cleanEmail);
      if (error) { console.log(`  ${t}: ERROR ${error.message}`); continue; }
      if (data?.length) {
        found = true;
        for (const r of data) {
          console.log(`  ⚠ ${t}: id=${r.id} deleted_at=${r.deleted_at || "NULL (ACTIVE!)"}`);
        }
      }
    }

    // Auth check with full pagination
    let authFound = false;
    for (let page = 0; page < 10; page++) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!data?.users?.length) break;
      const u = data.users.find(u => u.email?.toLowerCase() === cleanEmail);
      if (u) { console.log(`  ⚠ AUTH: ${u.id} - ${u.email}`); authFound = true; break; }
    }

    if (!found && !authFound) {
      console.log("  ✅ Completely clean - no records anywhere");
    }
  }

  console.log("\n✅ Verification complete");
}

main().catch(console.error);
