import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Fetch all payments with parent info
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        parent:parents(id, name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ data });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}