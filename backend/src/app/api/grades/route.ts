import { NextRequest } from "next/server";
import { listPublicResource } from "@/lib/curriculum";

export async function GET(req: NextRequest) {
  return listPublicResource("grades", req);
}
