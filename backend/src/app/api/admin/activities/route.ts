import { NextRequest } from "next/server";
import { createAdminActivity, listAdminActivities } from "@/lib/admin-activities";

export async function GET(req: NextRequest) {
  return listAdminActivities(req);
}

export async function POST(req: NextRequest) {
  return createAdminActivity(req);
}
