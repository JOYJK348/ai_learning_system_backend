import { NextRequest } from "next/server";
import { getParentChildBadges } from "@/lib/parent";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return getParentChildBadges(req, params.id);
}
