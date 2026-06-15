import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: parent, error } = await supabaseAdmin
      .from("parents")
      .select("*")
      .eq("id", params.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    if (!parent) return json({ error: "Parent not found" }, 404);

    // Get linked children
    const { data: links } = await supabaseAdmin
      .from("parent_student_links")
      .select("student_id,is_primary,students(id,full_name,grade_id,overall_progress,total_stars_earned,total_lessons_completed,last_activity_at)")
      .eq("parent_id", parent.id)
      .is("deleted_at", null);

    const children = (links || [])
      .filter((l: any) => l.students)
      .map((l: any) => {
        const s = l.students;
        return {
          id: s.id,
          name: s.full_name,
          grade_id: s.grade_id,
          overall_progress: s.overall_progress || 0,
          total_stars: s.total_stars_earned || 0,
          lessons_completed: s.total_lessons_completed || 0,
          last_activity_at: s.last_activity_at,
          is_primary: l.is_primary,
        };
      });

    // Get grade names
    const gradeIds = Array.from(new Set(children.map((c: any) => c.grade_id).filter(Boolean))) as string[];
    let gradeMap: Record<string, string> = {};
    if (gradeIds.length > 0) {
      const { data: grades } = await supabaseAdmin.from("grades").select("id,name").in("id", gradeIds);
      (grades || []).forEach((g: any) => { gradeMap[g.id] = g.name; });
    }

    const childrenWithGrade = children.map((c: any) => ({
      ...c,
      grade_name: c.grade_id ? gradeMap[c.grade_id] || "—" : "—",
    }));

    const [planType, planStatus, approvalStatus] = await Promise.all([
      supabaseAdmin.from("lookup_plan_types").select("code,name").eq("id", parent.plan_type_id).maybeSingle(),
      supabaseAdmin.from("lookup_plan_status").select("code,name").eq("id", parent.plan_status_id).maybeSingle(),
      supabaseAdmin.from("lookup_approval_status").select("code,name").eq("id", parent.approval_status_id).maybeSingle(),
    ]);

    return json({
      data: {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        profile_photo_url: parent.profile_photo_url,
        plan_type: planType.data?.code || "free",
        plan_type_name: planType.data?.name || "Free",
        plan_status: planStatus.data?.code || null,
        plan_status_name: planStatus.data?.name || null,
        approval_status: approvalStatus.data?.code || "approved",
        approval_status_name: approvalStatus.data?.name || "Approved",
        status_id: parent.status_id,
        plan_expires_at: parent.plan_expires_at,
        plan_started_at: parent.plan_started_at,
        registered_at: parent.registered_at,
        created_at: parent.created_at,
        children: childrenWithGrade,
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load parent" }, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const supabaseAdmin = getSupabaseAdmin();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.plan_type_id !== undefined) updates.plan_type_id = body.plan_type_id || null;
    if (body.plan_expires_at !== undefined) updates.plan_expires_at = body.plan_expires_at || null;

    const { data, error } = await supabaseAdmin
      .from("parents")
      .update(updates)
      .eq("id", params.id)
      .is("deleted_at", null)
      .select("id,name,email,phone")
      .maybeSingle();

    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Parent not found" }, 404);

    return json({ data });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to update parent" }, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("parents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.id)
      .is("deleted_at", null);

    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to delete parent" }, 500);
  }
}
