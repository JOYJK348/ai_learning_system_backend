import { NextRequest } from "next/server";
import { createSchoolStudent, listSchoolStudents } from "@/lib/school";

export async function GET(req: NextRequest) {
  return listSchoolStudents(req);
}

export async function POST(req: NextRequest) {
  return createSchoolStudent(req);
}
