import { NextRequest } from "next/server";
import { getSchoolAdminDashboard } from "@/lib/school";

export async function GET(req: NextRequest) {
  return getSchoolAdminDashboard(req);
}
