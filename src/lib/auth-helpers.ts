import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "./supabase";
import { getSupabaseAdmin } from "./supabase-server";

export const ACCESS_COOKIE = "zhi_access_token";
export const REFRESH_COOKIE = "zhi_refresh_token";

export type UserRole = "super_admin" | "school_admin" | "parent" | "student";

export type AuthUser = {
  id: string;
  email: string | null;
  role: UserRole;
  profileId: string;
  schoolId?: string | null;
  name: string;
};

export const allowedRoles: UserRole[] = ["super_admin", "school_admin", "parent", "student"];

export function json(data: unknown, status = 200) {
  const res = NextResponse.json(data, { status });
  const origin = process.env.FRONTEND_ORIGIN;
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
}

export function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
}

export function getUserAgent(req: NextRequest) {
  return req.headers.get("user-agent") || "";
}

export function validatePassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

export function hashValue(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashOtp(otp: string) {
  return hashValue(`${process.env.SUPABASE_SERVICE_ROLE_KEY}:${otp}`);
}

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function decodeJwtExp(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken?: string) {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60
  });

  if (refreshToken) {
    res.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: secure ? "none" : "lax",
      path: "/api/auth",
      maxAge: 60 * 60 * 24 * 30
    });
  }
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", path: "/api/auth", maxAge: 0 });
}

export async function logAuthAttempt(input: {
  email?: string;
  role?: string;
  success: boolean;
  reason?: string;
  ip: string;
  userAgent: string;
  userId?: string;
}) {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("auth_attempt_logs").insert({
    email: input.email?.toLowerCase(),
    role: input.role,
    success: input.success,
    reason: input.reason,
    ip_address: input.ip,
    user_agent: input.userAgent,
    auth_user_id: input.userId
  });
}

export async function isRateLimited(email: string | undefined, ip: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  let query = supabaseAdmin
    .from("auth_attempt_logs")
    .select("id", { count: "exact", head: true })
    .eq("success", false)
    .eq("ip_address", ip)
    .gte("created_at", oneMinuteAgo);

  if (email) query = query.eq("email", email.toLowerCase());

  const { count } = await query;
  return (count || 0) >= 5;
}

export async function isTokenBlacklisted(token: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const { data } = await supabaseAdmin
    .from("token_blacklist")
    .select("id")
    .eq("token_hash", hashValue(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return Boolean(data);
}

export async function blacklistToken(token: string) {
  const supabaseAdmin = getSupabaseAdmin();
  const exp = decodeJwtExp(token);
  await supabaseAdmin.from("token_blacklist").insert({
    token_hash: hashValue(token),
    expires_at: exp ? new Date(exp * 1000).toISOString() : new Date(Date.now() + 60 * 60 * 1000).toISOString()
  });
}

export async function getProfileForAuthUser(authUserId: string): Promise<AuthUser | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const admin = await supabaseAdmin
    .from("admins")
    .select("id,email,name,role:lookup_user_roles(code)")
    .eq("auth_user_id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (admin.data) {
    return {
      id: authUserId,
      email: admin.data.email,
      role: "super_admin",
      profileId: admin.data.id,
      name: admin.data.name
    };
  }

  const schoolAdmin = await supabaseAdmin
    .from("school_admins")
    .select("id,email,name,school_id")
    .eq("auth_user_id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (schoolAdmin.data) {
    return {
      id: authUserId,
      email: schoolAdmin.data.email,
      role: "school_admin",
      profileId: schoolAdmin.data.id,
      schoolId: schoolAdmin.data.school_id,
      name: schoolAdmin.data.name
    };
  }

  const parent = await supabaseAdmin
    .from("parents")
    .select("id,email,name,school_id")
    .eq("auth_user_id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (parent.data) {
    return {
      id: authUserId,
      email: parent.data.email,
      role: "parent",
      profileId: parent.data.id,
      schoolId: parent.data.school_id,
      name: parent.data.name
    };
  }

  const student = await supabaseAdmin
    .from("students")
    .select("id,full_name,email")
    .eq("auth_user_id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (student.data) {
    return {
      id: authUserId,
      email: student.data.email || null,
      role: "student",
      profileId: student.data.id,
      name: student.data.full_name
    };
  }

  return null;
}

export async function getCurrentUser(req: NextRequest) {
  let token = req.headers.get("Authorization")?.replace(/^Bearer\s+/, "");
  if (!token) {
    token = req.cookies.get(ACCESS_COOKIE)?.value;
  }
  if (!token || (await isTokenBlacklisted(token))) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  return getProfileForAuthUser(data.user.id);
}

export function requireRole(user: AuthUser | null, roles: UserRole[]) {
  return Boolean(user && roles.includes(user.role));
}

export async function checkSchoolPlanExpired(schoolId: string): Promise<{ expired: boolean; expiresAt: string | null }> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("plan_expires_at")
    .eq("id", schoolId)
    .maybeSingle();
  if (!school?.plan_expires_at) return { expired: false, expiresAt: null };
  const expired = new Date(school.plan_expires_at) < new Date();
  return { expired, expiresAt: school.plan_expires_at };
}

export async function requireSchoolAdmin(req: NextRequest) {
  const currentUser = await getCurrentUser(req);
  if (!requireRole(currentUser, ["school_admin"]) || !currentUser?.schoolId) return { user: null };
  const { expired } = await checkSchoolPlanExpired(currentUser.schoolId);
  if (expired) return { user: currentUser, planExpired: true };
  return { user: currentUser };
}
