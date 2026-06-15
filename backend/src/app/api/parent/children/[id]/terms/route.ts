import { NextRequest } from "next/server";
import { getParentChildTerms } from "@/lib/parent";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return getParentChildTerms(req, params.id);
}
