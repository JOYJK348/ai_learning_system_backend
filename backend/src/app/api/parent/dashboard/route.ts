import { NextRequest } from "next/server";
import { getParentDashboard } from "@/lib/parent";

export async function GET(req: NextRequest) {
  return getParentDashboard(req);
}
