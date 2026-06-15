import { NextRequest } from "next/server";
import { getParentChildProgress } from "@/lib/parent";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return getParentChildProgress(req, params.id);
}
