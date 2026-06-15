import { NextRequest } from "next/server";
import { getStudentMe } from "@/lib/student";

export async function GET(req: NextRequest) {
  return getStudentMe(req);
}
