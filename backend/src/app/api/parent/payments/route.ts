import { NextRequest } from "next/server";
import { createParentPayment, listParentPayments } from "@/lib/parent";

export async function GET(req: NextRequest) {
  return listParentPayments(req);
}

export async function POST(req: NextRequest) {
  return createParentPayment(req);
}
