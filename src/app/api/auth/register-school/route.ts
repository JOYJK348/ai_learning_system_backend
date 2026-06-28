import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getClientIp, getUserAgent, json, logAuthAttempt } from "@/lib/auth-helpers";
import { sendSchoolRegistrationReceivedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const body = await req.json().catch(() => ({}));

  const schoolName = String(body.school_name || "").trim();
  const adminName = String(body.admin_name || "").trim();
  const adminEmail = String(body.admin_email || "").trim().toLowerCase();
  const adminPhone = String(body.admin_phone || "").trim();
  const address = String(body.address || "").trim();
  const city = String(body.city || "").trim();
  const boardName = String(body.board_name || "").trim();

  if (!schoolName || !adminName || !adminEmail) {
    return json({ error: "school_name, admin_name, and admin_email are required" }, 400);
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Check if email already registered or pending anywhere in the system
  const cleanEmail = adminEmail.trim().toLowerCase();

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
        ? "A parent registration with this email is already pending approval."
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
        ? "A registration with this email is already pending approval."
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

  // Insert into school_registrations
  const { data, error } = await supabaseAdmin
    .from("school_registrations")
    .insert({
      school_name: schoolName,
      admin_name: adminName,
      admin_email: adminEmail,
      admin_phone: adminPhone || null,
      address: address || null,
      city: city || null,
      board_name: boardName || null,
      status: "pending",
    })
    .select("id,status,created_at")
    .single();

  if (error) return json({ error: error.message }, 400);

  await logAuthAttempt({ email: adminEmail, role: "school_admin", success: true, reason: "register_school_pending", ip, userAgent });

  // Send "Registration Received" confirmation email in the background
  sendSchoolRegistrationReceivedEmail({
    adminEmail,
    adminName,
    schoolName,
  }).catch(err => console.error("School registration received email error:", err));

  return json({ data: { id: data.id, status: data.status, message: "School onboarding request submitted for approval" } }, 201);
}
