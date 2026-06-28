import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { sendWelcomeEmail } from "@/lib/email";

function getParentPassword(phone: string | null): string {
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.length >= 6) {
    return cleanPhone.slice(-6);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getStudentPassword(phone: string | null): string {
  const cleanPhone = String(phone || "").replace(/[^0-9]/g, "");
  if (cleanPhone.length >= 6) {
    return cleanPhone.slice(0, 6);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");
  const rejectionReason = String(body.rejection_reason || "");

  if (!["approve", "reject"].includes(action)) {
    return json({ error: "action must be 'approve' or 'reject'" }, 400);
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: reg, error: regError } = await supabaseAdmin
      .from("parent_registrations")
      .select("*")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (regError || !reg) return json({ error: "Registration not found" }, 404);
    if (reg.status !== "pending") return json({ error: "Already " + reg.status }, 400);

    if (action === "reject") {
      const { error: updateError } = await supabaseAdmin
        .from("parent_registrations")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason || null,
          rejected_by: user!.profileId,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (updateError) return json({ error: updateError.message }, 500);
      return json({ data: { status: "rejected" } });
    }

    // ── Approve: Create auth users + profiles ──
    const parentPass = getParentPassword(reg.parent_phone);
    const childPass = getStudentPassword(reg.parent_phone);

    const activeStatusId = (await supabaseAdmin.from("lookup_entity_status").select("id").eq("code", "active").single()).data?.id;
    const approvedApprovalId = (await supabaseAdmin.from("lookup_approval_status").select("id").eq("code", "approved").single()).data?.id;
    const freePlanId = (await supabaseAdmin.from("lookup_plan_types").select("id").eq("code", "free").single()).data?.id;
    const activePlanId = (await supabaseAdmin.from("lookup_plan_status").select("id").eq("code", "active").single()).data?.id;

    if (!activeStatusId || !approvedApprovalId) return json({ error: "Lookup config missing" }, 500);

    // Create parent auth
    const { data: parentAuth, error: paErr } = await supabaseAdmin.auth.admin.createUser({
      email: reg.parent_email,
      password: parentPass,
      email_confirm: true,
      user_metadata: { role: "parent", name: reg.parent_name },
    });
    if (paErr || !parentAuth?.user) return json({ error: "Failed to create parent auth: " + paErr?.message }, 500);

    // Create child auth  
    const cleanChildFirstName = reg.child_name.trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const phoneDigits = String(reg.parent_phone || "").replace(/[^0-9]/g, "");
    const lastFour = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString();
    const childEmail = `${cleanChildFirstName}.${lastFour}@zhi.app`;

    const { data: childAuth, error: caErr } = await supabaseAdmin.auth.admin.createUser({
      email: childEmail,
      password: childPass,
      email_confirm: true,
      user_metadata: { role: "student", name: reg.child_name },
    });
    if (caErr || !childAuth?.user) {
      await supabaseAdmin.auth.admin.deleteUser(parentAuth.user.id);
      return json({ error: "Failed to create student auth: " + caErr?.message }, 500);
    }

    const sanitizedPhone = reg.parent_phone ? String(reg.parent_phone).replace(/[^0-9]/g, "") : null;

    // Insert parent profile
    const { data: parentRec, error: ppErr } = await supabaseAdmin.from("parents").insert({
      auth_user_id: parentAuth.user.id,
      email: reg.parent_email,
      phone: sanitizedPhone,
      name: reg.parent_name,
      registration_type: reg.school_id ? "school" : "individual",
      school_id: reg.school_id || null,
      plan_type_id: freePlanId,
      plan_status_id: activePlanId,
      approval_status_id: approvedApprovalId,
      status_id: activeStatusId,
    }).select("id").single();

    if (ppErr || !parentRec) {
      await supabaseAdmin.auth.admin.deleteUser(parentAuth.user.id);
      await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id);
      return json({ error: "Failed to create parent profile: " + ppErr?.message }, 500);
    }

    // Insert student profile
    const { data: studentRec, error: spErr } = await supabaseAdmin.from("students").insert({
      auth_user_id: childAuth.user.id,
      full_name: reg.child_name,
      grade_id: reg.child_grade_id || null,
      gender: reg.child_gender || null,
      date_of_birth: reg.child_dob || null,
      status_id: activeStatusId,
    }).select("id").single();

    if (spErr || !studentRec) {
      await supabaseAdmin.from("parents").delete().eq("id", parentRec.id);
      await supabaseAdmin.auth.admin.deleteUser(parentAuth.user.id);
      await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id);
      return json({ error: "Failed to create student profile: " + spErr?.message }, 500);
    }

    // Link parent → student
    await supabaseAdmin.from("parent_student_links").insert({
      parent_id: parentRec.id,
      student_id: studentRec.id,
      is_primary: true,
    });

    // Auto-create lesson_progress for chapter 1
    if (reg.child_grade_id) {
      const { data: engSubj } = await supabaseAdmin
        .from("subjects")
        .select("id")
        .eq("grade_id", reg.child_grade_id)
        .eq("code", "english")
        .is("deleted_at", null)
        .maybeSingle();

      if (engSubj) {
        const { data: chs } = await supabaseAdmin
          .from("chapters")
          .select("id")
          .eq("subject_id", engSubj.id)
          .is("deleted_at", null)
          .order("sort_order", { ascending: true })
          .limit(1);

        if (chs && chs.length > 0) {
          const { data: ch1Lessons } = await supabaseAdmin
            .from("lessons")
            .select("id")
            .eq("chapter_id", chs[0].id)
            .is("deleted_at", null);

          if (ch1Lessons && ch1Lessons.length > 0) {
            const batch = ch1Lessons.map((l: { id: string }) => ({
              student_id: studentRec.id,
              lesson_id: l.id,
              status: "not_started",
              completion_percentage: 0,
              last_accessed_at: new Date().toISOString(),
            }));
            await supabaseAdmin.from("lesson_progress").insert(batch);
          }
        }
      }
    }

    await supabaseAdmin.from("parent_registrations").update({
      status: "approved",
      approved_by: user!.profileId,
      approved_at: new Date().toISOString(),
    }).eq("id", params.id);

    // Send Welcome Email containing credentials via Resend
    sendWelcomeEmail({
      parentEmail: reg.parent_email,
      parentName: reg.parent_name,
      parentPass: parentPass,
      childName: reg.child_name,
      childEmail: childEmail,
      childPass: childPass,
    }).catch(err => {
      console.error("Welcome email background send error:", err);
    });

    return json({
      data: {
        status: "approved",
        parent_credentials: { email: reg.parent_email, password: parentPass },
        child_credentials: { email: childEmail, password: childPass, name: reg.child_name },
      }
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Approval failed" }, 500);
  }
}
