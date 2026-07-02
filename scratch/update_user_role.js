const fs = require('fs');
const path = require('path');

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

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const targetEmail = 'allaccess@zhi.com';

(async () => {
  try {
    // 1. Find user in auth list
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const user = users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (!user) {
      console.error(`User not found: ${targetEmail}`);
      return;
    }

    console.log("Current user metadata:", user.user_metadata);

    // 2. Update Supabase auth user metadata role to 'student'
    const newMetadata = {
      ...user.user_metadata,
      role: 'student',
      name: 'Super Star'
    };

    console.log("Updating auth user role to 'student' with name 'Super Star'...");
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: newMetadata }
    );

    if (updateError) throw updateError;
    console.log("Supabase update success! New user metadata:", updateData.user.user_metadata);

  } catch (err) {
    console.error("Error updating user:", err.message || err);
  }
})();
