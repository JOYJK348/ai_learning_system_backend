import { NextRequest } from "next/server";
import { getCurrentUser, json } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ user });
}
