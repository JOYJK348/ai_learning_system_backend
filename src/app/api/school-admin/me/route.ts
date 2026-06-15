import { NextRequest } from "next/server";
import { getSchoolAdminMe } from "@/lib/school";

export async function GET(req: NextRequest) {
  return getSchoolAdminMe(req);
}
