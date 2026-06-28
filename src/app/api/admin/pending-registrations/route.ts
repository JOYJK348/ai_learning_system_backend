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

    const { data: parentRegs, error: parentError } = await query;
    if (parentError) return json({ error: parentError.message }, 500);

    let schoolQuery = supabaseAdmin
      .from("school_registrations")
      .select("id, school_name, admin_name, admin_email, admin_phone, address, city, board_name, status, rejection_reason, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (status) {
      schoolQuery = schoolQuery.eq("status", status);
    }

    const { data: schoolRegs, error: schoolError } = await schoolQuery;

    if (schoolError) return json({ error: schoolError.message }, 500);

    // Fetch child linking requests
    let linkReqsQuery = supabaseAdmin
      .from("child_link_requests")
      .select(`
        id, child_name, child_gender, child_dob, status, rejection_reason, created_at,
        parents!parent_id(name, email, phone),
        grades!child_grade_id(name)
      `)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (status) {
      linkReqsQuery = linkReqsQuery.eq("status", status);
    }

    const { data: childLinkReqs, error: childLinkError } = await linkReqsQuery;
    if (childLinkError) return json({ error: childLinkError.message }, 500);

    const formattedParents = (parentRegs || []).map((r: any) => ({
      id: r.id,
      parent_name: r.parent_name,
      parent_email: r.parent_email,
      parent_phone: r.parent_phone,
      child_name: r.child_name,
      grade: r.grades?.name || null,
      school: r.schools?.name || null,
      status: r.status,
      rejection_reason: r.rejection_reason,
      created_at: r.created_at,
      is_school: false,
      is_link_request: false
    }));

    const formattedSchools = (schoolRegs || []).map((r: any) => ({
      id: r.id,
      parent_name: r.admin_name,
      parent_email: r.admin_email,
      parent_phone: r.admin_phone,
      school_name: r.school_name,
      board_name: r.board_name,
      city: r.city,
      address: r.address,
      status: r.status,
      rejection_reason: r.rejection_reason,
      created_at: r.created_at,
      is_school: true,
      is_link_request: false
    }));

    const formattedLinkRequests = (childLinkReqs || []).map((r: any) => ({
      id: r.id,
      parent_name: r.parents?.name || "Parent",
      parent_email: r.parents?.email || "",
      parent_phone: r.parents?.phone || "",
      child_name: r.child_name,
      grade: r.grades?.name || null,
      school: null,
      status: r.status,
      rejection_reason: r.rejection_reason,
      created_at: r.created_at,
      is_school: false,
      is_link_request: true
    }));

    const merged = [...formattedParents, ...formattedSchools, ...formattedLinkRequests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return json({ data: merged });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Failed to load" }, 500);
  }
}

