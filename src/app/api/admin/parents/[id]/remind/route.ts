import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();

    // Get parent details
    const { data: parent } = await supabase
      .from('parents')
      .select('name, email, plan_end_date, plan_type')
      .eq('id', params.id)
      .single();

    if (!parent) {
      return json({ error: "Parent not found" }, 404);
    }

    const daysLeft = parent.plan_end_date
      ? Math.ceil((new Date(parent.plan_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    // Create notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        parent_id: params.id,
        type: 'payment_reminder',
        status: 'pending',
        content: `Hi ${parent.name || 'there'}, your ${parent.plan_type} plan expires in ${daysLeft} days. Please renew to continue access.`,
        email: parent.email,
      })
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    // TODO: Integrate with email service (SendGrid/AWS SES)
    // await sendEmail(parent.user.email, 'Payment Reminder', content);

    return json({ data, message: "Reminder queued for sending" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}