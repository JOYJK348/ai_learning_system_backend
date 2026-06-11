import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const ACTIVE = 1;

export async function GET(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.toLowerCase()?.trim() || "";

    // Get all student_ids belonging to this school
    const { data: schoolStudents } = await supabaseAdmin
      .from("school_students")
      .select("student_id")
      .eq("school_id", user.schoolId)
      .is("deleted_at", null);

    const schoolStudentIds = (schoolStudents || []).map((s) => s.student_id).filter(Boolean) as string[];

    // Find parent IDs linked to those students
    const { data: links } = await supabaseAdmin
      .from("parent_student_links")
      .select("parent_id,student_id,is_primary")
      .in("student_id", schoolStudentIds)
      .is("deleted_at", null);

    const linkedParentIds = new Set((links || []).map((l) => l.parent_id).filter(Boolean) as string[]);

    const { data: schoolParents } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("school_id", user.schoolId)
      .is("deleted_at", null);

    const parentIds = Array.from(new Set([
      ...linkedParentIds,
      ...(schoolParents || []).map((p) => p.id).filter(Boolean),
    ]));

    if (parentIds.length === 0) return json({ data: [] });

    // Build children map per parent (only from links)
    const childrenByParent: Record<string, { student_id: string; is_primary: boolean; student_name: string }[]> = {};
    (links || []).forEach((l) => {
      if (!childrenByParent[l.parent_id]) childrenByParent[l.parent_id] = [];
      childrenByParent[l.parent_id].push({ student_id: l.student_id, is_primary: l.is_primary, student_name: "" });
    });

    // Fetch parent records
    let query = supabaseAdmin
      .from("parents")
      .select("id,name,email,phone,plan_type_id,plan_status_id,approval_status_id,status_id,plan_expires_at,plan_started_at,registered_at,created_at")
      .in("id", parentIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: parents, error } = await query;
    if (error) return json({ error: error.message }, 500);

    const allStudentIds = Array.from(new Set((links || []).map((l) => l.student_id).filter(Boolean))) as string[];
    const { data: studentRows } = await supabaseAdmin
      .from("students")
      .select("id,full_name,grade_id")
      .in("id", allStudentIds)
      .is("deleted_at", null);

    const studentNameMap: Record<string, string> = {};
    const studentGradeMap: Record<string, string> = {};
    const gradeIds = Array.from(new Set((studentRows || []).map((s) => s.grade_id).filter(Boolean))) as string[];
    let gradeNameMap: Record<string, string> = {};
    if (gradeIds.length > 0) {
      const { data: grades } = await supabaseAdmin.from("grades").select("id,name").in("id", gradeIds);
      (grades || []).forEach((g: { id: string; name: string }) => { gradeNameMap[g.id] = g.name; });
    }
    (studentRows || []).forEach((s) => {
      studentNameMap[s.id] = s.full_name;
      studentGradeMap[s.id] = s.grade_id ? gradeNameMap[s.grade_id] || "" : "";
    });

    const lookup = await Promise.all([
      supabaseAdmin.from("lookup_plan_types").select("id,code,name"),
      supabaseAdmin.from("lookup_plan_status").select("id,code,name"),
      supabaseAdmin.from("lookup_approval_status").select("id,code,name"),
    ]);

    const planTypeMap: Record<number, { code: string; name: string }> = {};
    (lookup[0].data || []).forEach((pt) => { planTypeMap[pt.id] = { code: pt.code, name: pt.name }; });

    const planStatusMap: Record<number, { code: string; name: string }> = {};
    (lookup[1].data || []).forEach((ps) => { planStatusMap[ps.id] = { code: ps.code, name: ps.name }; });

    const approvalMap: Record<number, { code: string; name: string }> = {};
    (lookup[2].data || []).forEach((ap) => { approvalMap[ap.id] = { code: ap.code, name: ap.name }; });

    const enriched = (parents || []).map((p) => {
      const parentChildren = (childrenByParent[p.id] || []).map((l) => ({
        student_id: l.student_id,
        name: studentNameMap[l.student_id] || "Unknown",
        grade_name: studentGradeMap[l.student_id] || null,
        is_primary: l.is_primary,
      }));

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        plan_type: planTypeMap[p.plan_type_id]?.code || "free",
        plan_type_name: planTypeMap[p.plan_type_id]?.name || "Free",
        plan_status: planStatusMap[p.plan_status_id]?.code || null,
        plan_status_name: planStatusMap[p.plan_status_id]?.name || null,
        approval_status: approvalMap[p.approval_status_id]?.code || "approved",
        approval_status_name: approvalMap[p.approval_status_id]?.name || "Approved",
        status_id: p.status_id,
        plan_expires_at: p.plan_expires_at,
        plan_started_at: p.plan_started_at,
        registered_at: p.registered_at,
        created_at: p.created_at,
        children: parentChildren,
        children_count: parentChildren.length,
      };
    });

    return json({ data: enriched });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load parents" }, 500);
  }
}

export async function POST(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const password = String(body.password || phone.slice(-6) || "Parent@123");

  if (!name) return json({ error: "Name is required" }, 400);
  if (!email) return json({ error: "Email is required" }, 400);

  const supabaseAdmin = getSupabaseAdmin();

  // 1. Create auth user
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "parent", name },
  });

  if (authError) return json({ error: authError.message }, 400);

  try {
    // 2. Insert parent record
    const { data: parent, error: parentError } = await supabaseAdmin
      .from("parents")
      .insert({
        auth_user_id: authUser.user.id,
        school_id: user.schoolId,
        name,
        email,
        phone: phone || null,
        status_id: ACTIVE,
      })
      .select("id,name,email,phone,created_at")
      .single();

    if (parentError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return json({ error: parentError.message }, 400);
    }

    // 3. Link children if provided
    const childIds = Array.isArray(body.child_ids) ? body.child_ids : [];
    if (childIds.length > 0) {
      // Verify children belong to this school
      const { data: validLinks } = await supabaseAdmin
        .from("school_students")
        .select("student_id")
        .eq("school_id", user.schoolId)
        .in("student_id", childIds)
        .is("deleted_at", null);

      const validIds = new Set((validLinks || []).map((s) => s.student_id));
      const toInsert = childIds.filter((id: string) => validIds.has(id)).map((studentId: string) => ({
        parent_id: parent.id,
        student_id: studentId,
        is_primary: true,
      }));

      if (toInsert.length > 0) {
        const { error: linkError } = await supabaseAdmin
          .from("parent_student_links")
          .insert(toInsert);

        if (linkError) {
          await supabaseAdmin.from("parents").delete().eq("id", parent.id);
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          return json({ error: linkError.message }, 400);
        }
      }
    }

    return json({
      data: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        username: email,
        password,
      },
    }, 201);
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id).catch(() => {});
    return json({ error: error instanceof Error ? error.message : "Failed to create parent" }, 500);
  }
}
