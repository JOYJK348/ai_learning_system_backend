import { getPublicResourceById } from "@/lib/curriculum";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return getPublicResourceById("lessons", params.id);
}
