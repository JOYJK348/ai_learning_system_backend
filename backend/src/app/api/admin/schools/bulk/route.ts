import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const { ids, action } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return json({ error: 'Invalid or missing ids array' }, 400);
    }
    if (!['activate', 'deactivate', 'renew', 'remind'].includes(action)) {
      return json({ error: 'Invalid action' }, 400);
    }

    const supabase = getSupabaseAdmin();

    if (action === 'activate' || action === 'deactivate') {
      const { data: statusTypes } = await supabase.from('lookup_entity_status').select('id, code');
      const targetStatusCode = action === 'activate' ? 'active' : 'inactive';
      const statusId = statusTypes?.find(s => s.code === targetStatusCode)?.id;

      if (!statusId) return json({ error: 'Could not resolve status ID' }, 500);

      const { error } = await supabase
        .from('schools')
        .update({ status_id: statusId, updated_at: new Date().toISOString() })
        .in('id', ids)
        .is('deleted_at', null);

      if (error) return json({ error: error.message }, 400);
    } else if (action === 'renew') {
      // Loop through each to renew and create payment
      for (const id of ids) {
        const { data: school } = await supabase
          .from('schools')
          .select('plan_expires_at, plan_price, revenue_total, revenue_this_month, plan_type_id')
          .eq('id', id)
          .single();

        if (school) {
          const baseDate = school.plan_expires_at ? new Date(school.plan_expires_at) : new Date();
          if (baseDate.getTime() < new Date().getTime()) baseDate.setTime(new Date().getTime());
          baseDate.setDate(baseDate.getDate() + 30);
          
          const amount = Number(school.plan_price) || 0;
          
          await supabase.from('schools').update({ 
            plan_expires_at: baseDate.toISOString(),
            revenue_total: (Number(school.revenue_total) || 0) + amount,
            revenue_this_month: (Number(school.revenue_this_month) || 0) + amount
          }).eq('id', id);

          if (amount > 0) {
            await supabase.from('payments').insert({
              school_id: id,
              plan_type_id: school.plan_type_id,
              plan_price_snapshot: amount,
              amount: amount,
              currency: 'INR',
              gateway_name: 'manual',
              paid_at: new Date().toISOString()
            });
          }
        }
      }
    } else if (action === 'remind') {
      // Mock sending bulk reminder emails
    }

    return json({ message: `Bulk action '${action}' applied to ${ids.length} schools` });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Bulk action failed' }, 500);
  }
}
