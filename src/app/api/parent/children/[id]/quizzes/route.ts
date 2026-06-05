import { NextRequest } from "next/server";
import { getParentChildQuizzes } from "@/lib/parent";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return getParentChildQuizzes(req, params.id);
}
