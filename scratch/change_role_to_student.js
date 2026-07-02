const fs = require('fs');
const path = require('path');

// Manually parse .env files
function loadEnv() {
  const paths = ['.env.local', '.env.development', '.env'];
  for (const file of paths) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const k = trimmed.substring(0, idx).trim();
            let v = trimmed.substring(idx + 1).trim();
            // strip quotes
            if (v.startsWith('"') && v.endsWith('"')) v = v.substring(1, v.length - 1);
            if (v.startsWith("'") && v.endsWith("'")) v = v.substring(1, v.length - 1);
            process.env[k] = v;
          }
        }
      });
      break;
    }
  }
}

loadEnv();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const targetEmail = 'allaccess@zhi.com';

(async () => {
  try {
    console.log(`Searching for auth user with email: ${targetEmail}...`);
    // 1. Get the auth user list
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (!user) {
      console.error(`No auth user found with email ${targetEmail}`);
      return;
    }

    console.log("Found User in Auth:", {
      id: user.id,
      email: user.email,
      role: user.role,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata
    });

    const userId = user.id;

    // 2. Query other tables to see where this user ID currently resides
    console.log("\nChecking database tables for ID:", userId);
    
    const checkTables = ['students', 'parents', 'school_admins', 'admins'];
    for (const tbl of checkTables) {
      const { data, error } = await supabaseAdmin
        .from(tbl)
        .select('*')
        .eq('auth_user_id', userId);
      if (error) {
        console.log(`Error checking ${tbl}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`Found in table "${tbl}":`, data);
      }
    }

    // Let's also check if grade LKG exists in lookup_grades or grades
    console.log("\nChecking grades/LKG info...");
    const { data: gradesData, error: gradesError } = await supabaseAdmin
      .from('lookup_grades')
      .select('*');
    if (gradesError) {
      const { data: gradesData2, error: gradesError2 } = await supabaseAdmin
        .from('grades')
        .select('*');
      console.log("Grades:", gradesData2 || gradesError2?.message);
    } else {
      console.log("Lookup Grades:", gradesData);
    }

  } catch (err) {
    console.error("Error running script:", err);
  }
})();
