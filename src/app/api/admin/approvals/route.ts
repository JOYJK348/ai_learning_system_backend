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

    // approval_status_id=1 → 'pending' in lookup_approval_status
    // parents table has name, email, phone directly (no separate users table)
    const { data, error } = await supabase
      .from("parents")
      .select(`
        id,
        name,
        email,
        phone,
        plan_type_id,
        approval_status_id,
        created_at,
        plan_type:lookup_plan_types(code, name),
        children:parent_student_links(count)
      `)
      .eq("approval_status_id", 1)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) return json({ error: error.message }, 500);

    const approvals = (data || []).map((parent: any) => {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(parent.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const urgencyScore = Math.min(10, daysSinceCreated + (parent.plan_type_id === 2 ? 3 : 0));

      return {
        id: parent.id,
        parent_id: parent.id,
        parent_name: parent.name || "Unknown",
        parent_email: parent.email || "",
        parent_phone: parent.phone || "",
        children_count: parent.children?.[0]?.count ?? 0,
        plan_selected: parent.plan_type?.name || "Free",
        plan_type_id: parent.plan_type_id,
        status: "pending",
        created_at: parent.created_at,
        urgency_score: urgencyScore,
      };
    });

    return json({ data: approvals });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}