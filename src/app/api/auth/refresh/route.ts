import { NextRequest } from "next/server";
import { REFRESH_COOKIE, json, setAuthCookies } from "@/lib/auth-helpers";
import { getSupabase } from "@/lib/supabase";

async function handleRefresh(req: NextRequest, tokenFromClient?: string) {
  const refreshToken = tokenFromClient || req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return json({ error: "Refresh token missing" }, 401);

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return json({ error: "Session refresh failed" }, 401);

  const res = json({
    ok: true,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
  setAuthCookies(res, data.session.access_token, data.session.refresh_token);
  return res;
}

export async function GET(req: NextRequest) {
  return handleRefresh(req);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleRefresh(req, body.refresh_token);
}
