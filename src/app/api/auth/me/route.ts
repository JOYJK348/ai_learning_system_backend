import { NextRequest } from "next/server";
import { checkSchoolPlanExpired, getCurrentUser, json } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) return json({ error: "Unauthorized" }, 401);

  let planExpired = false;
  if (user.role === "school_admin" && user.schoolId) {
    const { expired } = await checkSchoolPlanExpired(user.schoolId);
    planExpired = expired;
  }

  return json({ user, plan_expired: planExpired || undefined });
}
