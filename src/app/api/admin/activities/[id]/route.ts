import { NextRequest } from "next/server";
import { deleteAdminActivity, updateAdminActivity } from "@/lib/admin-activities";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return updateAdminActivity(params.id, req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return deleteAdminActivity(params.id, req);
}
