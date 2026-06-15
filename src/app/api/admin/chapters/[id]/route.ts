import { NextRequest } from "next/server";
import { deleteAdminResource, updateAdminResource } from "@/lib/curriculum";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return updateAdminResource("chapters", params.id, req);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return deleteAdminResource("chapters", params.id, req);
}
