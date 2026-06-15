import { NextRequest } from "next/server";
import { submitActivity } from "@/lib/student";

export async function POST(req: NextRequest, { params }: { params: { id: string; activityId: string } }) {
  return submitActivity(req, params.activityId);
}
