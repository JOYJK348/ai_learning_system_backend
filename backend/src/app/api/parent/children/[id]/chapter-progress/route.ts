import { NextRequest } from "next/server";
import { getParentChildChapterProgress } from "@/lib/parent";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return getParentChildChapterProgress(req, params.id);
}
