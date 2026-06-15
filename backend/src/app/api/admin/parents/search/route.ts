import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query || query.length < 2) {
      return json({ data: [] });
    }

    // Search parents by name, email, or phone
    const { data: parents, error } = await supabase
      .from('parents')
      .select('id, name, email, phone')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .is('deleted_at', null)
      .limit(10);

    if (error) return json({ error: error.message }, 500);

    return json({ data: parents || [] });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error searching parents' }, 500);
  }
}
