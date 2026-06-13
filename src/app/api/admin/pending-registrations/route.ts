import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    let query = supabaseAdmin
      .from("parent_registrations")
      .select(`
        id, parent_name, parent_email, parent_phone, child_name,
        child_grade_id, school_id, status, rejection_reason,
        approved_by, approved_at, rejected_by, rejected_at, created_at,
        grades!child_grade_id(name),
        schools!school_id(name)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) return json({ error: error.message }, 500);

    const data2 = (data || []).map((r: Record<string, unknown>) => ({
      id: r.id,
      parent_name: r.parent_name,
      parent_email: r.parent_email,
      parent_phone: r.parent_phone,
      child_name: r.child_name,
      grade: (r.grades as Record<string, unknown> | undefined)?.name || null,
      school: (r.schools as Record<string, unknown> | undefined)?.name || null,
      status: r.status,
      rejection_reason: r.rejection_reason,
      created_at: r.created_at,
    }));

    return json({ data: data2 });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to load" }, 500);
  }
}
