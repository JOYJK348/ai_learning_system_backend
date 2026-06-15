import { NextRequest } from "next/server";
import { listParentChildren } from "@/lib/parent";

export async function GET(req: NextRequest) {
  return listParentChildren(req);
}
