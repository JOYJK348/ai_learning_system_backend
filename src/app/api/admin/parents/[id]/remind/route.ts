import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();

    // parents table has name, email, phone directly — no users join needed
    // plan_expires_at is the real column (not plan_end_date)
    const { data: parent, error: parentError } = await supabase
      .from("parents")
      .select(`
        id,
        name,
        email,
        plan_expires_at,
        plan_type_id,
        plan_type:lookup_plan_types(name, code)
      `)
      .eq("id", params.id)
      .is("deleted_at", null)
      .single();

    if (parentError || !parent) {
      return json({ error: "Parent not found" }, 404);
    }

    const daysLeft = parent.plan_expires_at
      ? Math.ceil(
          (new Date(parent.plan_expires_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    const planName = (parent.plan_type as any)?.name || "your";

    // Insert reminder into notifications table (from payments_schema.sql bolt-on)
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        parent_id: params.id,
        type: "payment_reminder",
        status: "pending",
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    // Log admin action
    await supabase.from("admin_activity_logs").insert({
      admin_id: user!.profileId,
      action_id: 2, // update
      entity_type: "parents",
      entity_id: params.id,
      details: {
        action: "payment_reminder_sent",
        days_left: daysLeft,
        email: parent.email,
      },
    });

    // TODO: Integrate with email service (SendGrid/AWS SES)
    // await sendEmail(parent.email, 'Payment Reminder', content);

    return json({ data, message: "Reminder queued for sending" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}