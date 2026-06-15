import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getPlanByTypeId, calculateNewExpiry } from "@/config/plans";

async function resolvePlanType(supabase: ReturnType<typeof getSupabaseAdmin>, code: string) {
  const { data } = await supabase.from('lookup_plan_types').select('id, code');
  return data?.find(p => p.code === code)?.id;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();

    if (error || !school) return json({ error: "School not found" }, 404);
    return json({ data: school });
  } catch (e) {
    return json({ error: "Error fetching school" }, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const body = await req.json();
    const supabase = getSupabaseAdmin();
    
    let status_id = body.status_id;
    if (body.status) {
      const { data: statusTypes } = await supabase.from('lookup_entity_status').select('id, code');
      status_id = statusTypes?.find(s => s.code === body.status)?.id;
      delete body.status;
    }
    
    let plan_type_id = body.plan_type_id;
    let planTypeChanged = false;
    if (body.plan_type) {
      const resolvedId = await resolvePlanType(supabase, body.plan_type);
      if (resolvedId) plan_type_id = resolvedId;
      delete body.plan_type;
    }

    // Check if plan type actually changed
    if (plan_type_id) {
      const { data: current } = await supabase
        .from('schools')
        .select('plan_type_id, plan_expires_at')
        .eq('id', params.id)
        .maybeSingle();
      if (current && current.plan_type_id !== plan_type_id) {
        planTypeChanged = true;
      }
    }
    
    const updatePayload: any = {
      ...body,
      updated_at: new Date().toISOString()
    };
    if (status_id) updatePayload.status_id = status_id;
    if (plan_type_id) {
      updatePayload.plan_type_id = plan_type_id;

      // Auto-recalculate expiry when plan type changes
      if (planTypeChanged) {
        const planConfig = getPlanByTypeId(plan_type_id);
        if (planConfig && planConfig.days > 0) {
          updatePayload.plan_status_id = 1;
          const { data: currentSchool } = await supabase
            .from('schools')
            .select('plan_expires_at')
            .eq('id', params.id)
            .maybeSingle();
          updatePayload.plan_expires_at = calculateNewExpiry(currentSchool?.plan_expires_at ?? null, planConfig.days);
          updatePayload.plan_started_at = new Date().toISOString();
          if (planConfig.price > 0) updatePayload.plan_price = planConfig.price;
        } else {
          updatePayload.plan_status_id = 1;
        }
      }
    }
    
    delete updatePayload.admin_name;
    delete updatePayload.admin_email;
    delete updatePayload.admin_phone;
    delete updatePayload.student_count;
    delete updatePayload.student_limit;
    delete updatePayload.plan_name;
    delete updatePayload.days_until_expiry;
    delete updatePayload.plan_start_date;
    delete updatePayload.plan_end_date;
    
    if (body.student_limit) updatePayload.max_students = body.student_limit;

    const { data, error } = await supabase
      .from('schools')
      .update(updatePayload)
      .eq('id', params.id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) return json({ error: error.message }, 400);
    return json({ data, message: 'Updated successfully' });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error updating school' }, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('schools')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) return json({ error: error.message }, 400);
    return json({ message: 'School deleted successfully' });
  } catch (e) {
    return json({ error: 'Error deleting school' }, 500);
  }
}
