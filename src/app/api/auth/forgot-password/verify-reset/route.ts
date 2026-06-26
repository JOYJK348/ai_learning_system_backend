import { NextRequest } from "next/server";
import { getClientIp, getUserAgent, hashOtp, json, logAuthAttempt, validatePassword } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const body = await req.json().catch(() => ({}));
  
  const identity = body.identity ? String(body.identity).trim().toLowerCase() : null;
  const otp = body.otp ? String(body.otp).trim() : null;
  const newPassword = body.newPassword ? String(body.newPassword) : null;

  if (!identity || !otp || !newPassword) {
    return json({ error: "Identity, OTP, and new password are required" }, 400);
  }

  if (!validatePassword(newPassword)) {
    return json({ error: "Password must be 8+ characters with at least 1 uppercase letter and 1 number" }, 400);
  }

  const supabaseAdmin = getSupabaseAdmin();
  let authUser: any = null;
  let role: string | null = null;
  let targetEmail: string | null = null;
  let targetAuthUserId: string | null = null;

  // 1. Try to fetch user directly by their Auth email
  const { data: userData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: null }));
  const foundUser = userData?.users?.find((u: any) => u.email === identity);
  if (foundUser) {
    authUser = foundUser;
    role = authUser.user_metadata?.role || null;
    targetAuthUserId = authUser.id;
  }

  // 2. If not found, check if they entered a personal contact email for a school admin
  if (!authUser) {
    const { data: adminProfile } = await supabaseAdmin
      .from("school_admins")
      .select("auth_user_id, email")
      .eq("email", identity)
      .is("deleted_at", null)
      .maybeSingle();

    if (adminProfile) {
      targetAuthUserId = adminProfile.auth_user_id;
      role = "school_admin";
      targetEmail = adminProfile.email;
    }
  }

  // 3. Resolve role and email to verify OTP against
  if (targetAuthUserId && !targetEmail) {
    if (role === "parent" || role === "super_admin") {
      targetEmail = identity;
    } else if (role === "school_admin") {
      const { data: adminProfile } = await supabaseAdmin
        .from("school_admins")
        .select("email")
        .eq("auth_user_id", targetAuthUserId)
        .is("deleted_at", null)
        .maybeSingle();
      if (adminProfile) {
        targetEmail = adminProfile.email;
      }
    } else if (role === "student") {
      // Find parent's email for the student
      const { data: studentProfile } = await supabaseAdmin
        .from("students")
        .select("id")
        .eq("auth_user_id", targetAuthUserId)
        .is("deleted_at", null)
        .maybeSingle();

      if (studentProfile) {
        const { data: parentLink } = await supabaseAdmin
          .from("parent_student_links")
          .select("parent_id")
          .eq("student_id", studentProfile.id)
          .is("deleted_at", null)
          .maybeSingle();

        if (parentLink) {
          const { data: parentProfile } = await supabaseAdmin
            .from("parents")
            .select("email")
            .eq("id", parentLink.parent_id)
            .is("deleted_at", null)
            .maybeSingle();

          if (parentProfile) {
            targetEmail = parentProfile.email;
          }
        }
      }
    }
  }

  if (!targetEmail || !targetAuthUserId) {
    await logAuthAttempt({ email: identity, success: false, reason: "reset_identity_invalid", ip, userAgent });
    return json({ error: "Invalid username or email address" }, 400);
  }

  // 4. Verify OTP in database
  const { data: otpRec, error: otpError } = await supabaseAdmin
    .from("otp_verifications")
    .select("id, attempt_count, expires_at, verified_at")
    .eq("email", targetEmail)
    .eq("otp_hash", hashOtp(otp))
    .eq("purpose", "password_reset")
    .is("verified_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError || !otpRec) {
    await logAuthAttempt({ email: targetEmail, success: false, reason: "reset_otp_invalid", ip, userAgent });
    return json({ error: "Invalid or expired OTP code" }, 400);
  }

  if (otpRec.attempt_count >= 5) {
    return json({ error: "Too many failed attempts for this OTP. Please request a new one." }, 429);
  }

  // 5. Update password in Supabase Auth
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetAuthUserId, {
    password: newPassword
  });

  if (updateError) {
    await logAuthAttempt({ email: targetEmail, success: false, reason: `reset_update_failed: ${updateError.message}`, ip, userAgent });
    return json({ error: "Failed to update password: " + updateError.message }, 500);
  }

  // 6. Mark OTP verified
  await supabaseAdmin
    .from("otp_verifications")
    .update({
      verified_at: new Date().toISOString(),
      attempt_count: otpRec.attempt_count + 1
    })
    .eq("id", otpRec.id);

  await logAuthAttempt({ email: targetEmail, success: true, reason: "reset_success", ip, userAgent, userId: targetAuthUserId });

  return json({ ok: true });
}
