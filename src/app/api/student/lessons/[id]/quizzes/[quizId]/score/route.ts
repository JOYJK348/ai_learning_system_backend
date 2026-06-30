import { NextRequest } from "next/server";
import { submitQuizScore } from "@/lib/student";

// POST /api/student/lessons/[id]/quizzes/[quizId]/score
// Accepts pre-computed score (for local/custom quizzes without DB question IDs)
export async function POST(req: NextRequest, { params }: { params: { id: string; quizId: string } }) {
  return submitQuizScore(req, params.id, params.quizId);
}
