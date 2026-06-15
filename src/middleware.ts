import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "zhi_access_token";
type UserRole = "super_admin" | "school_admin" | "parent" | "student";

function corsHeaders(req: NextRequest) {
  const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const origin = req.headers.get("origin");

  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? origin : allowedOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization"
  };
}

function withCors(req: NextRequest, res: NextResponse) {
  const headers = corsHeaders(req);
  Object.entries(headers).forEach(([key, value]) => res.headers.set(key, value));
  return res;
}

const roleRouteMap: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/api/admin", roles: ["super_admin"] },
  { prefix: "/api/super-admin", roles: ["super_admin"] },
  { prefix: "/api/school-admin", roles: ["super_admin", "school_admin"] },
  { prefix: "/api/parent", roles: ["super_admin", "parent"] },
  { prefix: "/api/student", roles: ["super_admin", "school_admin", "parent", "student"] }
];

const publicApiPrefixes = ["/api/boards", "/api/grades", "/api/subjects", "/api/chapters", "/api/lessons"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(req)
    });
  }

  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/seed/") || pathname === "/api/register-parent") return withCors(req, NextResponse.next());
  if (publicApiPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return withCors(req, NextResponse.next());
  }

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) return withCors(req, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return withCors(req, NextResponse.json({ error: "Auth environment is not configured" }, { status: 500 }));
  }

  const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey
    }
  });

  if (!authRes.ok) return withCors(req, NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

  const user = await authRes.json();

  const role = user.user_metadata?.role as UserRole | undefined;
  const rule = roleRouteMap.find((item) => pathname.startsWith(item.prefix));
  if (rule && (!role || !rule.roles.includes(role))) {
    return withCors(req, NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }

  return withCors(req, NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"]
};
