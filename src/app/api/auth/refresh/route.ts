import { NextRequest } from "next/server";
import { REFRESH_COOKIE, json, setAuthCookies } from "@/lib/auth-helpers";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return json({ error: "Refresh token missing" }, 401);

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return json({ error: "Session refresh failed" }, 401);

  const res = json({ ok: true });
  setAuthCookies(res, data.session.access_token, data.session.refresh_token);
  return res;
}
