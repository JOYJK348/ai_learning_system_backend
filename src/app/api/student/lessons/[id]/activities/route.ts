import { NextRequest } from "next/server";
import { listStudentActivities } from "@/lib/student";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return listStudentActivities(req, params.id);
}


