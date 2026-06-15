import { NextRequest } from "next/server";
import { getClientIp, getUserAgent, hashOtp, json, logAuthAttempt } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const body = await req.json().catch(() => ({}));
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const phone = body.phone ? String(body.phone).trim() : null;
  const otp = String(body.otp || "").trim();
  const purpose = String(body.purpose || "signup");

  if ((!email && !phone) || !otp) return json({ error: "Email/phone and OTP are required" }, 400);

  const supabaseAdmin = getSupabaseAdmin();
  let query = supabaseAdmin
    .from("otp_verifications")
    .select("id,attempt_count,expires_at,verified_at")
    .eq("otp_hash", hashOtp(otp))
    .eq("purpose", purpose)
    .is("verified_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  query = email ? query.eq("email", email) : query.eq("phone", phone);
  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    await logAuthAttempt({ email: email || undefined, success: false, reason: "otp_invalid", ip, userAgent });
    return json({ error: "Invalid or expired OTP" }, 400);
  }

  if (data.attempt_count >= 5) {
    return json({ error: "OTP attempt limit reached" }, 429);
  }

  await supabaseAdmin
    .from("otp_verifications")
    .update({ verified_at: new Date().toISOString(), attempt_count: data.attempt_count + 1 })
    .eq("id", data.id);

  await logAuthAttempt({ email: email || undefined, success: true, reason: "otp_verify", ip, userAgent });
  return json({ ok: true });
}
