import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();

    // Get current expiry and plan_type using only base columns
    const { data: school, error: schoolErr } = await supabase
      .from('schools')
      .select('plan_expires_at, plan_type_id')
      .eq('id', params.id)
      .single();

    if (schoolErr || !school) return json({ error: "School not found" }, 404);

    const baseDate = school.plan_expires_at ? new Date(school.plan_expires_at) : new Date();
    if (baseDate.getTime() < new Date().getTime()) {
      baseDate.setTime(new Date().getTime());
    }
    baseDate.setDate(baseDate.getDate() + 30);

    // Update only plan_expires_at (always exists). Extended revenue fields updated separately.
    const { error: updateErr } = await supabase
      .from('schools')
      .update({ plan_expires_at: baseDate.toISOString() })
      .eq('id', params.id);

    if (updateErr) return json({ error: updateErr.message }, 400);

    // Try fetching extended fields and updating revenue (silently fails if patch not run)
    const { data: extended } = await supabase
      .from('schools')
      .select('plan_price, revenue_total, revenue_this_month')
      .eq('id', params.id)
      .single();

    const amount = Number((extended as any)?.plan_price) || 0;
    if (amount > 0 && extended) {
      await supabase
        .from('schools')
        .update({
          revenue_total: (Number((extended as any).revenue_total) || 0) + amount,
          revenue_this_month: (Number((extended as any).revenue_this_month) || 0) + amount
        })
        .eq('id', params.id);
    }

    // Record payment if there is an amount
    if (amount > 0) {
      await supabase.from('payments').insert({
        school_id: params.id,
        plan_type_id: school.plan_type_id,
        plan_price_snapshot: amount,
        amount: amount,
        currency: 'INR',
        gateway_name: 'manual',
        paid_at: new Date().toISOString()
      });
    }

    return json({ message: 'Plan renewed successfully' });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error renewing plan' }, 500);
  }
}

