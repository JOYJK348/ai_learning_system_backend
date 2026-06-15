import { NextRequest } from "next/server";
import { json } from "@/lib/auth-helpers";
import { getPlans } from "@/config/plans";

export async function GET(_req: NextRequest) {
  try {
    const plans = await getPlans();
    return json({ data: plans });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Failed to load plans" },
      500
    );
  }
}
