import { NextRequest } from "next/server";
import { generateOtp, getClientIp, getUserAgent, hashOtp, isRateLimited, json, logAuthAttempt } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { sendPasswordResetOtpEmail } from "@/lib/email";

// Helper to obscure email for security (e.g., principal@school.com -> p********l@school.com)
function obscureEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  return `${localPart[0]}${"*".repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const body = await req.json().catch(() => ({}));
  const identity = body.identity ? String(body.identity).trim().toLowerCase() : null;

  if (!identity) {
    return json({ error: "Email or username is required" }, 400);
  }

  if (await isRateLimited(identity, ip)) {
    return json({ error: "Too many requests. Try again after one minute." }, 429);
  }

  const supabaseAdmin = getSupabaseAdmin();
  let authUser: any = null;
  let role: string | null = null;
  let targetEmail: string | null = null;
  let targetName = "User";
  let targetAuthUserId: string | null = null;

  // 1. Try to fetch user directly by their Auth email (covers parents, super_admins, and system generated logins like admin.xxx@zhi.app or name.xxxx@zhi.app)
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
      .select("auth_user_id, email, name")
      .eq("email", identity)
      .is("deleted_at", null)
      .maybeSingle();

    if (adminProfile) {
      targetAuthUserId = adminProfile.auth_user_id;
      role = "school_admin";
      targetEmail = adminProfile.email;
      targetName = adminProfile.name;
    }
  }

  // 3. Resolve role and email to dispatch OTP to
  if (targetAuthUserId && !targetEmail) {
    if (role === "parent" || role === "super_admin") {
      targetEmail = identity;
      targetName = authUser.user_metadata?.name || "Parent";
    } else if (role === "school_admin") {
      const { data: adminProfile } = await supabaseAdmin
        .from("school_admins")
        .select("email, name")
        .eq("auth_user_id", targetAuthUserId)
        .is("deleted_at", null)
        .maybeSingle();
      if (adminProfile) {
        targetEmail = adminProfile.email;
        targetName = adminProfile.name;
      }
    } else if (role === "student") {
      // Find parent's email for the student
      const { data: studentProfile } = await supabaseAdmin
        .from("students")
        .select("id, full_name")
        .eq("auth_user_id", targetAuthUserId)
        .is("deleted_at", null)
        .maybeSingle();

      if (studentProfile) {
        targetName = studentProfile.full_name;
        // Lookup primary linked parent
        const { data: parentLink } = await supabaseAdmin
          .from("parent_student_links")
          .select("parent_id")
          .eq("student_id", studentProfile.id)
          .is("deleted_at", null)
          .maybeSingle();

        if (parentLink) {
          const { data: parentProfile } = await supabaseAdmin
            .from("parents")
            .select("email, name")
            .eq("id", parentLink.parent_id)
            .is("deleted_at", null)
            .maybeSingle();

          if (parentProfile) {
            targetEmail = parentProfile.email;
            // Address the parent in the email since they are receiving the child's credentials
            targetName = parentProfile.name;
          }
        }
      }
    }
  }

  // If no email was resolved, we fail silently or return a generic error to prevent user enumeration
  if (!targetEmail) {
    await logAuthAttempt({ email: identity, success: false, reason: "reset_identity_not_found", ip, userAgent });
    return json({ error: "If the account exists, an OTP has been sent." }, 200);
  }

  // 4. Generate and store OTP
  const otp = generateOtp();
  const { error: otpError } = await supabaseAdmin.from("otp_verifications").insert({
    email: targetEmail,
    otp_hash: hashOtp(otp),
    purpose: "password_reset",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    ip_address: ip,
    user_agent: userAgent
  });

  if (otpError) {
    await logAuthAttempt({ email: targetEmail, success: false, reason: "reset_otp_save_failed", ip, userAgent });
    return json({ error: "Failed to generate OTP" }, 500);
  }

  // 5. Send Email
  const sent = await sendPasswordResetOtpEmail({
    email: targetEmail,
    name: targetName,
    otp: otp
  });

  if (!sent) {
    return json({ error: "Failed to send reset OTP email" }, 500);
  }

  await logAuthAttempt({ email: targetEmail, success: true, reason: "reset_otp_sent", ip, userAgent });

  return json({
    ok: true,
    recipient: obscureEmail(targetEmail)
  });
}
