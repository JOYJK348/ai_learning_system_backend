import { NextRequest } from "next/server";
import { listStudentBadges } from "@/lib/student";

export async function GET(req: NextRequest) {
  return listStudentBadges(req);
}
