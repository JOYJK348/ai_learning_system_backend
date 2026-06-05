import { NextRequest } from "next/server";
import { ACCESS_COOKIE, blacklistToken, clearAuthCookies, getClientIp, getUserAgent, json, logAuthAttempt } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (token) await blacklistToken(token);

  const res = json({ ok: true });
  clearAuthCookies(res);
  await logAuthAttempt({
    success: true,
    reason: "logout",
    ip: getClientIp(req),
    userAgent: getUserAgent(req)
  });
  return res;
}
