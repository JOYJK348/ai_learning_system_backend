import { NextRequest } from "next/server";
import { generateOtp, getClientIp, getUserAgent, hashOtp, isRateLimited, json, logAuthAttempt } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const allowedPurposes = ["signup", "login", "password_reset", "parent_approval", "payment"];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const body = await req.json().catch(() => ({}));
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const phone = body.phone ? String(body.phone).trim() : null;
  const purpose = String(body.purpose || "signup");

  if ((!email && !phone) || !allowedPurposes.includes(purpose)) {
    return json({ error: "Valid email or phone and purpose are required" }, 400);
  }

  if (await isRateLimited(email || phone || undefined, ip)) {
    return json({ error: "Too many OTP requests. Try again after one minute." }, 429);
  }

  const otp = generateOtp();
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("otp_verifications").insert({
    email,
    phone,
    otp_hash: hashOtp(otp),
    purpose,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    ip_address: ip,
    user_agent: userAgent
  });

  if (error) {
    await logAuthAttempt({ email: email || undefined, success: false, reason: error.message, ip, userAgent });
    return json({ error: "OTP create failed" }, 500);
  }

  await logAuthAttempt({ email: email || undefined, success: true, reason: "otp_send", ip, userAgent });

  return json({
    ok: true,
    expiresInSeconds: 600,
    deliveryPending: true,
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp
  });
}
