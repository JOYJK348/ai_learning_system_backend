import { NextRequest } from "next/server";
import { getParentMe, updateParentProfile } from "@/lib/parent";

export async function GET(req: NextRequest) {
  return getParentMe(req);
}

export async function PUT(req: NextRequest) {
  return updateParentProfile(req);
}
