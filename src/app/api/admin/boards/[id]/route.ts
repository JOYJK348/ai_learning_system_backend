import { NextRequest } from "next/server";
import { deleteAdminResource, updateAdminResource } from "@/lib/curriculum";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return updateAdminResource("boards", params.id, req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return deleteAdminResource("boards", params.id, req);
}
