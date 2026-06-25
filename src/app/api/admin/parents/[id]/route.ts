import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return null;
  return user;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
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

    // Fetch payment history and children in parallel
    const [paymentsRes, linksRes, planTypesRes, planStatusRes, approvalStatusRes] = await Promise.all([
      supabaseAdmin
        .from("parent_payments")
        .select("id,amount,currency,status,payment_id,confirmed_at,created_at,plan:plans(name)")
        .eq("parent_id", params.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("parent_student_links")
        .select("student_id,students(id,full_name,grade_id,profile_photo_url,total_lessons_completed,total_quizzes_attempted,total_quizzes_passed,total_stars_earned,status_id)")
        .eq("parent_id", params.id),
      supabaseAdmin.from("lookup_plan_types").select("id,code,name"),
      supabaseAdmin.from("lookup_plan_status").select("id,code,name,color"),
      supabaseAdmin.from("lookup_approval_status").select("id,code,name,color"),
    ]);

    const planTypeMap: Record<number, string> = {};
    (planTypesRes.data || []).forEach(pt => { planTypeMap[pt.id] = pt.name; });

    const planStatusMap: Record<number, string> = {};
    (planStatusRes.data || []).forEach(ps => { planStatusMap[ps.id] = ps.name; });

    const approvalStatusMap: Record<number, string> = {};
    (approvalStatusRes.data || []).forEach(aps => { approvalStatusMap[aps.id] = aps.name; });

    // Payment status lookup
    const paymentStatusMap: Record<string, { name: string; color: string }> = {
      pending: { name: "pending", color: "#F59E0B" },
      success: { name: "success", color: "#22C55E" },
      failed: { name: "failed", color: "#EF4444" },
      refunded: { name: "refunded", color: "#6B7280" },
    };

    const payments = (paymentsRes.data || []).map((pay: any) => ({
      id: pay.id,
      amount: pay.amount,
      currency: pay.currency || "INR",
      plan: pay.plan?.name || "—",
      gateway: pay.payment_id ? "Razorpay" : "manual",
      notes: null,
      status: pay.status || "pending",
      status_color: paymentStatusMap[pay.status]?.color ?? "#6B7280",
      paid_at: pay.confirmed_at || pay.created_at,
      created_at: pay.created_at,
    }));

    // Enrich children with grade names + school info
    const studentLinks = (linksRes.data || []).filter((l: any) => l.students);
    const gradeIds = Array.from(new Set(studentLinks.map((l: any) => l.students.grade_id).filter(Boolean)));
    let gradeMap: Record<string, string> = {};
    if (gradeIds.length > 0) {
      const { data: grades } = await supabaseAdmin.from("grades").select("id,name").in("id", gradeIds as string[]);
      (grades || []).forEach((g: any) => { gradeMap[g.id] = g.name; });
    }

    // Fetch school info for each child
    const studentIds = studentLinks.map((l: any) => l.students.id);
    let schoolStudentsMap: Record<string, { school_id: string; section: string | null; roll_number: string | null }> = {};
    if (studentIds.length > 0) {
      const { data: ssData } = await supabaseAdmin
        .from("school_students")
        .select("student_id, school_id, section, roll_number")
        .in("student_id", studentIds)
        .is("deleted_at", null);
      for (const ss of ssData || []) {
        schoolStudentsMap[ss.student_id] = { school_id: ss.school_id, section: ss.section, roll_number: ss.roll_number };
      }
    }
    const schoolIds = Array.from(new Set(Object.values(schoolStudentsMap).map((s) => s.school_id).filter(Boolean)));
    let schoolMap: Record<string, string> = {};
    if (schoolIds.length > 0) {
      const { data: schools } = await supabaseAdmin.from("schools").select("id,name").in("id", schoolIds).is("deleted_at", null);
      (schools || []).forEach((sc: any) => { schoolMap[sc.id] = sc.name; });
    }

    const children = studentLinks.map((link: any) => {
      const s = link.students;
      const avgScore = s.total_quizzes_attempted > 0
        ? Math.round((s.total_quizzes_passed / s.total_quizzes_attempted) * 100)
        : 0;
      const schoolInfo = schoolStudentsMap[s.id];
      return {
        id: s.id,
        name: s.full_name,
        grade_name: s.grade_id ? gradeMap[s.grade_id] || "—" : "—",
        photo_url: s.profile_photo_url || null,
        total_stars: s.total_stars_earned || 0,
        lessons_completed: s.total_lessons_completed || 0,
        avg_score: avgScore,
        status_id: s.status_id,
        school_name: schoolInfo?.school_id ? schoolMap[schoolInfo.school_id] || null : null,
        section: schoolInfo?.section || null,
        roll_number: schoolInfo?.roll_number || null,
      };
    });

    return json({
      data: {
        ...parent,
        plan_name: parent.plan_type_id ? planTypeMap[parent.plan_type_id] : "Free",
        plan_status_name: parent.plan_status_id ? planStatusMap[parent.plan_status_id] : null,
        approval_status_name: parent.approval_status_id ? approvalStatusMap[parent.approval_status_id] : "Approved",
        payments,
        children,
        total_paid: payments.filter(p => p.status === "success").reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0),
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load parent" }, 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json().catch(() => ({}));
    const supabaseAdmin = getSupabaseAdmin();

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.status_id !== undefined) updates.status_id = body.status_id;
    if (body.plan_type_id !== undefined) updates.plan_type_id = body.plan_type_id || null;
    if (body.plan_status_id !== undefined) updates.plan_status_id = body.plan_status_id || null;
    if (body.plan_expires_at !== undefined) updates.plan_expires_at = body.plan_expires_at || null;

    if (body.approval_status_id !== undefined) {
      updates.approval_status_id = body.approval_status_id;
      if (body.approval_status_id === 2) {
        updates.approved_by = user.profileId || null;
        updates.approved_at = new Date().toISOString();
      }
      if (body.approval_status_id === 3) {
        updates.rejected_by = user.profileId || null;
        updates.rejected_at = new Date().toISOString();
        if (body.rejection_reason) updates.rejection_reason = body.rejection_reason;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("parents")
      .update(updates)
      .eq("id", params.id)
      .is("deleted_at", null)
      .select()
      .maybeSingle();

    if (error) return json({ error: error.message }, 400);
    if (!data) return json({ error: "Parent not found" }, 404);

    return json({ data, ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to update parent" }, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
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
