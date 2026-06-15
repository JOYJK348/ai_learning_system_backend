import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("plans")
      .update({
        name: body.name,
        description: body.description,
        amount_monthly: body.amount_monthly,
        amount_yearly: body.amount_yearly,
        badge_label: body.badge_label,
        is_active: body.is_active,
        trial_days: body.trial_days,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ data, message: "Plan updated" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();

    // Soft delete — deactivate
    const { error } = await supabase
      .from("plans")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) return json({ error: error.message }, 500);

    // Also disable all plan_features for this plan
    await supabase.from("plan_features").delete().eq("plan_id", params.id);

    return json({ message: "Plan deleted" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
