import { NextRequest } from "next/server";
import { getStudentDashboard } from "@/lib/student";

export async function GET(req: NextRequest) {
  return getStudentDashboard(req);
}
