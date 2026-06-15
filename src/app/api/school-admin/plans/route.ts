import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { PLANS } from "@/config/plans";

export async function GET(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired" }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  return json({
    data: PLANS.map(p => ({
      type: p.type,
      name: p.name,
      price: p.displayPrice,
      display_price: p.displayPrice,
      numeric_price: p.price,
      period: p.period,
      desc: p.desc,
      days: p.days,
      features: p.features,
    })),
  });
}
