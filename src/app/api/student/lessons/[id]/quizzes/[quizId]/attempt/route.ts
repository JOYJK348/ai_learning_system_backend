import { NextRequest } from "next/server";
import { submitQuiz } from "@/lib/student";

export async function POST(req: NextRequest, { params }: { params: { id: string; quizId: string } }) {
  return submitQuiz(req, params.quizId);
}
