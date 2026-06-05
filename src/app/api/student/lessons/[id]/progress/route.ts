import { NextRequest } from "next/server";
import { updateLessonProgress } from "@/lib/student";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return updateLessonProgress(req, params.id);
}
