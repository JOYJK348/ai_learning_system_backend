import { NextRequest } from "next/server";
import { createAdminSchoolAdmin, listAdminSchoolAdmins } from "@/lib/school";

export async function GET(req: NextRequest) {
  return listAdminSchoolAdmins(req);
}

export async function POST(req: NextRequest) {
  return createAdminSchoolAdmin(req);
}
