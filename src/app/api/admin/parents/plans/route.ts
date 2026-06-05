import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

// GET - List all parents with plans
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('parents')
      .select(`
        id,
        user:users(name, email, phone, last_login),
        plan_type,
        plan_name,
        plan_price,
        status,
        plan_start_date,
        plan_end_date,
        total_paid,
        last_payment_date,
        children:parent_student_links(count),
        payments:payments(amount, status, created_at)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (plan) {
      query = query.eq('plan_type', plan);
    }

    const { data, error } = await query;

    if (error) {
      return json({ error: error.message }, 500);
    }

    const parents = (data || []).map((parent: any) => {
      const daysUntilExpiry = parent.plan_end_date
        ? Math.ceil((new Date(parent.plan_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      const lastLogin = parent.user?.last_login
        ? new Date(parent.user.last_login)
        : null;
      const daysSinceLogin = lastLogin
        ? Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let churnRisk: 'low' | 'medium' | 'high' = 'low';
      if (daysSinceLogin > 7 && daysUntilExpiry <= 7) churnRisk = 'high';
      else if (daysSinceLogin > 3 || daysUntilExpiry <= 14) churnRisk = 'medium';

      return {
        id: parent.id,
        parent_id: parent.id,
        parent_name: parent.user?.name || 'Unknown',
        parent_email: parent.user?.email || '',
        parent_phone: parent.user?.phone || '',
        plan_type: parent.plan_type,
        plan_name: parent.plan_name || parent.plan_type,
        plan_price: parent.plan_price || 0,
        status: parent.status,
        plan_start_date: parent.plan_start_date,
        plan_end_date: parent.plan_end_date,
        days_until_expiry: daysUntilExpiry,
        total_paid: parent.total_paid || 0,
        last_payment_date: parent.last_payment_date,
        children_count: parent.children?.[0]?.count || 0,
        last_login: parent.user?.last_login,
        churn_risk: churnRisk,
      };
    });

    return json({ data: parents });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}

// PUT - Upgrade/downgrade plan
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const body = await req.json();
    const { parent_id, plan_type_id } = body;

    if (!parent_id || !plan_type_id) {
      return json({ error: "Parent ID and plan type ID required" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Get plan details
    const { data: planData } = await supabase
      .from('plan_types')
      .select('*')
      .eq('id', plan_type_id)
      .single();

    if (!planData) {
      return json({ error: "Plan type not found" }, 404);
    }

    // Get current parent data for history
    const { data: currentParent } = await supabase
      .from('parents')
      .select('plan_type, plan_type_id')
      .eq('id', parent_id)
      .single();

    const { data, error } = await supabase
      .from('parents')
      .update({
        plan_type: planData.name,
        plan_type_id: plan_type_id,
        plan_price: planData.price,
        plan_start_date: new Date().toISOString(),
        plan_end_date: new Date(Date.now() + (planData.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      })
      .eq('id', parent_id)
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    // Log plan change
    await supabase.from('parent_plan_history').insert({
      parent_id: parent_id,
      old_plan: currentParent?.plan_type || 'unknown',
      new_plan: planData.name,
      changed_by: user!.id,
    });

    return json({ data, message: "Plan updated" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}