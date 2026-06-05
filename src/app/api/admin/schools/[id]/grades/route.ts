import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    
    // Fetch all active grades for the dropdown
    const { data: grades, error } = await supabase
      .from('grades')
      .select('id, name, code, sort_order')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) return json({ error: error.message }, 500);

    return json({ data: grades || [] });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error fetching grades' }, 500);
  }
}
