import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { json } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    let count = 0;
    for (const u of users?.users || []) {
      if (u.email?.includes("test")) {
        await supabaseAdmin.auth.admin.deleteUser(u.id);
        count++;
      }
    }

    // Also clean up any orphaned parent/student profiles
    await supabaseAdmin.from("parent_student_links").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("parents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("students").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    return json({ ok: true, deleted: count });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Cleanup failed" }, 500);
  }
}
