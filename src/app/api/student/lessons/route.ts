import { NextRequest } from "next/server";
import { listStudentLessons } from "@/lib/student";

export async function GET(req: NextRequest) {
  return listStudentLessons(req);
}
