import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const body = await req.json();
    const { status, reason } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return json({ error: "Status must be 'approved' or 'rejected'" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // approval_status_id: 2=approved, 3=rejected
    const approvalStatusId = status === "approved" ? 2 : 3;

    const updateData: Record<string, any> = {
      approval_status_id: approvalStatusId,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
      updateData.approved_by = user!.profileId;
      updateData.approved_at = new Date().toISOString();
      updateData.status_id = 1; // entity active
    } else {
      updateData.rejected_by = user!.profileId;
      updateData.rejected_at = new Date().toISOString();
      updateData.rejection_reason = reason || null;
    }

    const { data, error } = await supabase
      .from("parents")
      .update(updateData)
      .eq("id", params.id)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    // Log to approval_logs (from payments_schema.sql bolt-on)
    await supabase.from("approval_logs").insert({
      parent_id: params.id,
      approved_by: user!.profileId,
      status,
      reason: reason || null,
    });

    // Log to admin_activity_logs
    await supabase.from("admin_activity_logs").insert({
      admin_id: user!.profileId,
      action_id: status === "approved" ? 5 : 6, // 5=approve, 6=reject
      entity_type: "parents",
      entity_id: params.id,
      details: { status, reason },
    });

    return json({ data, message: `Parent ${status}` });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}