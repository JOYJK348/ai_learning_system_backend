import { NextRequest } from "next/server";
import { getParentMe } from "@/lib/parent";

export async function GET(req: NextRequest) {
  return getParentMe(req);
}
