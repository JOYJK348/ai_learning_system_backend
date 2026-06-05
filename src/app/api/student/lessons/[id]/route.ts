import { NextRequest } from "next/server";
import { getStudentLesson } from "@/lib/student";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return getStudentLesson(req, params.id);
}
