import { NextRequest } from "next/server";
import { listStudentTerms } from "@/lib/student";

export async function GET(req: NextRequest) {
  return listStudentTerms(req);
}
