import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { sendWelcomeEmail } from "@/lib/email";

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

    // Fetch the link request
    const { data: reg, error: regError } = await supabaseAdmin
      .from("child_link_requests")
      .select("*")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (regError || !reg) return json({ error: "Link request not found" }, 404);
    if (reg.status !== "pending") return json({ error: "Already " + reg.status }, 400);

    if (action === "reject") {
      const { error: updateError } = await supabaseAdmin
        .from("child_link_requests")
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

    // -- Action: Approve: Create student auth user + profiles --
    // Fetch parent email and details
    const { data: parentRec, error: parentErr } = await supabaseAdmin
      .from("parents")
      .select("email, phone, name")
      .eq("id", reg.parent_id)
      .single();

    if (parentErr || !parentRec) return json({ error: "Parent profile not found" }, 404);

    const childPass = getStudentPassword(parentRec.phone);
    const activeStatusId = (await supabaseAdmin.from("lookup_entity_status").select("id").eq("code", "active").single()).data?.id;

    if (!activeStatusId) return json({ error: "Lookup configuration 'active' status missing" }, 500);

    // Generate unique student email/login
    const cleanChildFirstName = reg.child_name.trim().split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    const phoneDigits = String(parentRec.phone || "").replace(/[^0-9]/g, "");
    const lastFour = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : Math.floor(1000 + Math.random() * 9000).toString();
    const childEmail = `${cleanChildFirstName}.${lastFour}@zhi.app`;

    // Create student auth account
    const { data: childAuth, error: caErr } = await supabaseAdmin.auth.admin.createUser({
      email: childEmail,
      password: childPass,
      email_confirm: true,
      user_metadata: { role: "student", name: reg.child_name },
    });
    if (caErr || !childAuth?.user) {
      return json({ error: "Failed to create student auth: " + caErr?.message }, 500);
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
      await supabaseAdmin.auth.admin.deleteUser(childAuth.user.id);
      return json({ error: "Failed to create student profile: " + spErr?.message }, 500);
    }

    // Link parent to student
    await supabaseAdmin.from("parent_student_links").insert({
      parent_id: reg.parent_id,
      student_id: studentRec.id,
      is_primary: false,
    });

    // Auto-create lesson progress for English Subject Chapter 1
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

    // Update child link request status
    await supabaseAdmin.from("child_link_requests").update({
      status: "approved",
      approved_by: user!.profileId,
      approved_at: new Date().toISOString(),
    }).eq("id", params.id);

    // Send Welcome Email
    sendWelcomeEmail({
      parentEmail: parentRec.email,
      parentName: parentRec.name,
      parentPass: "Same as existing password",
      childName: reg.child_name,
      childEmail: childEmail,
      childPass: childPass,
    }).catch(err => {
      console.error("Welcome email background send error:", err);
    });

    return json({
      data: {
        status: "approved",
        child_credentials: { email: childEmail, password: childPass, name: reg.child_name },
      }
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Approval failed" }, 500);
  }
}
