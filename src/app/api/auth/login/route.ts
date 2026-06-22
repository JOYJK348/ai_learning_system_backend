import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import {
  checkSchoolPlanExpired,
  getClientIp,
  getProfileForAuthUser,
  getUserAgent,
  isRateLimited,
  json,
  logAuthAttempt,
  setAuthCookies
} from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) return json({ error: "Email and password are required" }, 400);

  if (await isRateLimited(email, ip)) {
    await logAuthAttempt({ email, success: false, reason: "rate_limited", ip, userAgent });
    return json({ error: "Too many failed attempts. Try again after one minute." }, 429);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    await logAuthAttempt({ email, success: false, reason: error?.message || "invalid_credentials", ip, userAgent });
    return json(
      {
        error: "Invalid email or password",
        reason: process.env.NODE_ENV === "production" ? undefined : error?.message
      },
      401
    );
  }

  const profile = await getProfileForAuthUser(data.user.id);
  if (!profile) {
    await logAuthAttempt({ email, success: false, reason: "profile_not_found", ip, userAgent, userId: data.user.id });
    return json({ error: "User profile not found" }, 403);
  }

  if (profile.role === "school_admin" && profile.schoolId) {
    const { expired } = await checkSchoolPlanExpired(profile.schoolId);
    if (expired) {
      await logAuthAttempt({ email, success: false, reason: "plan_expired", ip, userAgent, userId: data.user.id });
      return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
    }
  }

  const res = json({
    user: profile,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
  setAuthCookies(res, data.session.access_token, data.session.refresh_token);
  await logAuthAttempt({ email, role: profile.role, success: true, ip, userAgent, userId: data.user.id });
  return res;
}
