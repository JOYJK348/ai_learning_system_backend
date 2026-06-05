import { listActivityTypes } from "@/lib/admin-activities";

export async function GET() {
  return listActivityTypes();
}
