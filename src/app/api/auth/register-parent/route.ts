import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getClientIp, getUserAgent, json, logAuthAttempt } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const body = await req.json().catch(() => ({}));

  const parentName = String(body.parent_name || "").trim();
  const parentEmail = String(body.parent_email || "").trim().toLowerCase();
  const parentPhone = String(body.parent_phone || "").trim();
  const childName = String(body.child_name || "").trim();
  const childGradeId = body.child_grade_id || null;
  const schoolId = body.school_id || null;

  if (!parentName || !parentEmail || !childName) {
    return json({ error: "parent_name, parent_email, and child_name are required" }, 400);
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Check if email already registered or pending anywhere in the system
  const cleanEmail = parentEmail.trim().toLowerCase();

  // 1. Check parent_registrations
  const { data: parentReg } = await supabaseAdmin
    .from("parent_registrations")
    .select("id, status")
    .eq("parent_email", cleanEmail)
    .is("deleted_at", null)
    .maybeSingle();
  if (parentReg) {
    return json({ 
      error: parentReg.status === "pending"
        ? "A registration with this email is already pending approval."
        : "This email is already registered. Please login."
    }, 409);
  }

  // 2. Check school_registrations
  const { data: schoolReg } = await supabaseAdmin
    .from("school_registrations")
    .select("id, status")
    .eq("admin_email", cleanEmail)
    .is("deleted_at", null)
    .maybeSingle();
  if (schoolReg) {
    return json({ 
      error: schoolReg.status === "pending"
        ? "A school registration with this email is already pending approval."
        : "This email is already registered as a school admin. Please login."
    }, 409);
  }

  // 3. Check parents table
  const { data: parentRecord } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("email", cleanEmail)
    .is("deleted_at", null)
    .maybeSingle();
  if (parentRecord) {
    return json({ error: "This email is already registered. Please login." }, 409);
  }

  // 4. Check school_admins table
  const { data: schoolAdminRecord } = await supabaseAdmin
    .from("school_admins")
    .select("id")
    .eq("email", cleanEmail)
    .is("deleted_at", null)
    .maybeSingle();
  if (schoolAdminRecord) {
    return json({ error: "This email is already registered as a school admin. Please login." }, 409);
  }

  // 5. Check admins table
  const { data: adminRecord } = await supabaseAdmin
    .from("admins")
    .select("id")
    .eq("email", cleanEmail)
    .is("deleted_at", null)
    .maybeSingle();
  if (adminRecord) {
    return json({ error: "This email is already registered. Please login." }, 409);
  }

  // 6. Check Auth users
  const { data: existingAuth } = await supabaseAdmin.auth.admin.listUsers();
  const emailExists = existingAuth?.users?.some((u: any) => u.email === cleanEmail);
  if (emailExists) {
    return json({ error: "This email is already registered. Please login." }, 409);
  }

  const { data, error } = await supabaseAdmin
    .from("parent_registrations")
    .insert({
      parent_name: parentName,
      parent_email: parentEmail,
      parent_phone: parentPhone || null,
      child_name: childName,
      child_grade_id: childGradeId || null,
      school_id: schoolId || null,
      status: "pending",
    })
    .select("id,status,created_at")
    .single();

  if (error) return json({ error: error.message }, 400);

  await logAuthAttempt({ email: parentEmail, role: "parent", success: true, reason: "register_pending", ip, userAgent });

  return json({ data: { id: data.id, status: data.status, message: "Registration submitted for approval" } }, 201);
}
