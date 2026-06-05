import { NextRequest } from "next/server";
import { listStudentQuizzes } from "@/lib/student";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return listStudentQuizzes(req, params.id);
}
