import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const studentId = String(body.student_id || "").trim();

  if (!studentId) return json({ error: "student_id is required" }, 400);

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Verify parent exists
    const { data: parent } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("id", params.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!parent) return json({ error: "Parent not found" }, 404);

    // Verify student belongs to this school
    const { data: link } = await supabaseAdmin
      .from("school_students")
      .select("student_id")
      .eq("school_id", user.schoolId)
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!link) return json({ error: "Student not found in this school" }, 404);

    // Check if already linked
    const { data: existing } = await supabaseAdmin
      .from("parent_student_links")
      .select("id")
      .eq("parent_id", params.id)
      .eq("student_id", studentId)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) return json({ error: "Student already linked to this parent" }, 409);

    const { data, error } = await supabaseAdmin
      .from("parent_student_links")
      .insert({ parent_id: params.id, student_id: studentId, is_primary: true })
      .select("id,student_id,is_primary")
      .single();

    if (error) return json({ error: error.message }, 400);
    return json({ data }, 201);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to link child" }, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  const url = new URL(req.url);
  const studentId = url.searchParams.get("student_id");

  if (!studentId) return json({ error: "student_id query param is required" }, 400);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("parent_student_links")
      .update({ deleted_at: new Date().toISOString() })
      .eq("parent_id", params.id)
      .eq("student_id", studentId)
      .is("deleted_at", null);

    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to unlink child" }, 500);
  }
}
