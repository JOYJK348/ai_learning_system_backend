import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('parents')
      .select(`
        id,
        user:users(name, email, phone),
        children:parent_student_links(count),
        plan_type,
        payment_status,
        payment_proof_url,
        approval_status,
        created_at
      `)
      .eq('approval_status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return json({ error: error.message }, 500);
    }

    // Calculate urgency score
    const approvals = (data || []).map((parent: any) => {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(parent.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const urgencyScore = Math.min(10, daysSinceCreated + (parent.payment_status === 'paid' ? 3 : 0));

      return {
        id: parent.id,
        parent_id: parent.id,
        parent_name: parent.user?.name || 'Unknown',
        parent_email: parent.user?.email || '',
        parent_phone: parent.user?.phone || '',
        children_count: parent.children?.[0]?.count || 0,
        plan_selected: parent.plan_type,
        payment_status: parent.payment_status,
        payment_proof_url: parent.payment_proof_url,
        status: parent.approval_status,
        created_at: parent.created_at,
        urgency_score: urgencyScore,
      };
    });

    return json({ data: approvals });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}