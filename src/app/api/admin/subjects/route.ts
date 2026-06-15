import { NextRequest } from "next/server";
import { createAdminResource, listAdminResource } from "@/lib/curriculum";

export async function GET(req: NextRequest) {
  return listAdminResource("subjects", req);
}

export async function POST(req: NextRequest) {
  return createAdminResource("subjects", req);
}
