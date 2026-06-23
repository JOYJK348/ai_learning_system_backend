import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

function generatePassword(name: string): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const special = "@#!$*".split("")[Math.floor(Math.random() * 5)];
  return name.charAt(0).toUpperCase() + name.slice(1, 4).toLowerCase() + special + num;
}

function generateSchoolCode(name: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const rand = Math.floor(100 + Math.random() * 900);
  return `${clean.slice(0, 8)}${rand}`;
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
      .from("school_registrations")
      .select("*")
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (regError || !reg) return json({ error: "School registration not found" }, 404);
    if (reg.status !== "pending") return json({ error: "Already " + reg.status }, 400);

    if (action === "reject") {
      const { error: updateError } = await supabaseAdmin
        .from("school_registrations")
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

    // ── Approve: Create School + Admin Auth + Admin Profile ──
    const adminPass = generatePassword(reg.admin_name);
    const schoolCode = generateSchoolCode(reg.school_name);

    // Lookups
    const activeStatusId = (await supabaseAdmin.from("lookup_entity_status").select("id").eq("code", "active").single()).data?.id;
    const schoolPlanTypeId = (await supabaseAdmin.from("lookup_plan_types").select("id").eq("code", "school").single()).data?.id;
    const activePlanStatusId = (await supabaseAdmin.from("lookup_plan_status").select("id").eq("code", "active").single()).data?.id;
    const schoolAdminRoleId = (await supabaseAdmin.from("lookup_user_roles").select("id").eq("code", "school_admin").single()).data?.id;

    if (!activeStatusId || !schoolPlanTypeId || !activePlanStatusId || !schoolAdminRoleId) {
      return json({ error: "Required lookup configuration missing" }, 500);
    }

    // 1. Create school record
    const { data: schoolRec, error: schoolErr } = await supabaseAdmin
      .from("schools")
      .insert({
        name: reg.school_name,
        code: schoolCode,
        address: reg.address || null,
        city: reg.city || null,
        phone: reg.admin_phone || null,
        email: reg.admin_email,
        principal_name: reg.admin_name,
        principal_phone: reg.admin_phone || null,
        plan_type_id: schoolPlanTypeId,
        plan_status_id: activePlanStatusId,
        plan_started_at: new Date().toISOString(),
        status_id: activeStatusId,
      })
      .select("id")
      .single();

    if (schoolErr || !schoolRec) {
      return json({ error: "Failed to create school record: " + schoolErr?.message }, 500);
    }

    // 2. Create school admin auth user
    const { data: adminAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: reg.admin_email,
      password: adminPass,
      email_confirm: true,
      user_metadata: { role: "school_admin", name: reg.admin_name },
    });

    if (authErr || !adminAuth?.user) {
      // rollback school creation
      await supabaseAdmin.from("schools").delete().eq("id", schoolRec.id);
      return json({ error: "Failed to create school admin auth: " + authErr?.message }, 500);
    }

    // 3. Create school admin profile record
    const { error: profileErr } = await supabaseAdmin
      .from("school_admins")
      .insert({
        auth_user_id: adminAuth.user.id,
        school_id: schoolRec.id,
        email: reg.admin_email,
        name: reg.admin_name,
        role_id: schoolAdminRoleId,
        phone: reg.admin_phone || null,
        status_id: activeStatusId,
      });

    if (profileErr) {
      // rollback auth and school
      await supabaseAdmin.auth.admin.deleteUser(adminAuth.user.id);
      await supabaseAdmin.from("schools").delete().eq("id", schoolRec.id);
      return json({ error: "Failed to create school admin profile: " + profileErr.message }, 500);
    }

    // 4. Update registration status
    await supabaseAdmin
      .from("school_registrations")
      .update({
        status: "approved",
        approved_by: user!.profileId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    return json({
      data: {
        status: "approved",
        school_code: schoolCode,
        admin_credentials: {
          email: reg.admin_email,
          password: adminPass,
        }
      }
    });

  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Approval failed" }, 500);
  }
}
