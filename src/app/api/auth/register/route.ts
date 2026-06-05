import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  allowedRoles,
  getClientIp,
  getUserAgent,
  json,
  logAuthAttempt,
  UserRole,
  validatePassword
} from "@/lib/auth-helpers";

async function lookupId(table: string, code: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from(table).select("id").eq("code", code).maybeSingle();
  if (error) throw new Error(`${table}.${code} lookup failed: ${error.message}`);
  if (!data) throw new Error(`${table}.${code} not found`);
  return data.id as number;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || body.fullName || "").trim();
  const role = String(body.role || "") as UserRole;

  if (!email || !password || !name || !allowedRoles.includes(role)) {
    return json({ error: "Email, password, name, and valid role are required" }, 400);
  }

  if (!validatePassword(password)) {
    return json({ error: "Password must be 8+ chars with 1 uppercase letter and 1 number" }, 400);
  }

  if (role === "super_admin" && body.registrationKey !== process.env.SUPER_ADMIN_REGISTRATION_KEY) {
    return json({ error: "Super admin registration is locked" }, 403);
  }

  if (role === "school_admin" && !body.schoolId) {
    return json({ error: "schoolId is required for school admin registration" }, 400);
  }

  const supabaseAdmin = getSupabaseAdmin();
  let activeStatusId: number;
  let roleId: number;

  try {
    activeStatusId = await lookupId("lookup_entity_status", "active");
    roleId = await lookupId("lookup_user_roles", role);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "database_lookup_failed";
    await logAuthAttempt({ email, role, success: false, reason, ip, userAgent });
    return json({ error: reason, hint: "Run database/final.sql and database/auth_security_patch.sql on the Supabase project used by .env.local" }, 500);
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, name }
  });

  if (createError || !created.user) {
    await logAuthAttempt({ email, role, success: false, reason: createError?.message || "register_failed", ip, userAgent });
    return json({ error: createError?.message || "Registration failed" }, 400);
  }

  const authUserId = created.user.id;

  try {
    if (role === "super_admin") {
      await supabaseAdmin.from("admins").insert({ auth_user_id: authUserId, email, name, role_id: roleId, status_id: activeStatusId });
    } else if (role === "school_admin") {
      await supabaseAdmin.from("school_admins").insert({
        auth_user_id: authUserId,
        school_id: body.schoolId,
        email,
        name,
        role_id: roleId,
        status_id: activeStatusId
      });
    } else if (role === "parent") {
      const freePlanId = await lookupId("lookup_plan_types", "free");
      const pendingApprovalId = await lookupId("lookup_approval_status", "pending");
      const activePlanId = await lookupId("lookup_plan_status", "active");
      await supabaseAdmin.from("parents").insert({
        auth_user_id: authUserId,
        email,
        phone: body.phone || null,
        name,
        registration_type: body.schoolId ? "school" : "individual",
        school_id: body.schoolId || null,
        plan_type_id: freePlanId,
        plan_status_id: activePlanId,
        approval_status_id: pendingApprovalId,
        status_id: activeStatusId
      });
    } else {
      await supabaseAdmin.from("students").insert({
        auth_user_id: authUserId,
        full_name: name,
        date_of_birth: body.dateOfBirth || null,
        grade_id: body.gradeId || null,
        status_id: activeStatusId
      });
    }
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    const reason = error instanceof Error ? error.message : "profile_create_failed";
    await logAuthAttempt({ email, role, success: false, reason, ip, userAgent, userId: authUserId });
    return json({ error: reason }, 400);
  }

  await logAuthAttempt({ email, role, success: true, reason: "register", ip, userAgent, userId: authUserId });
  return json({ ok: true, userId: authUserId, role }, 201);
}
