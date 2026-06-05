import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const body = await req.json();
    const { status, reason } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return json({ error: "Status must be 'approved' or 'rejected'" }, 400);
    }

    const supabase = getSupabaseAdmin();

    const updateData: any = {
      approval_status: status,
      approved_by: user!.id,
      approved_at: new Date().toISOString(),
    };

    if (status === 'rejected' && reason) {
      updateData.rejection_reason = reason;
    }

    if (status === 'approved') {
      updateData.status = 'active';
      if (updateData.plan_type === 'paid') {
        updateData.plan_status = 'paid';
      }
    }

    const { data, error } = await supabase
      .from('parents')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    // Log approval
    await supabase.from('approval_logs').insert({
      parent_id: params.id,
      approved_by: user!.id,
      status: status,
      reason: reason || null,
    });

    return json({ data, message: `Parent ${status}` });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}