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

    // 1. Parents with trial or active subscriptions
    const { data: trialParents, error: trialError } = await supabase
      .from("parent_subscriptions")
      .select(`
        id,
        parent_id,
        status,
        created_at,
        plan:plans(id, code, name, amount_monthly),
        parent:parents!inner(id, name, email, phone, created_at)
      `)
      .in("status", ["trial", "active"])
      .order("created_at", { ascending: false });

    if (trialError) return json({ error: trialError.message }, 500);

    // 2. Parents with no subscription (recently registered)
    const allSubParentIds = [...new Set((trialParents || []).map((s: any) => s.parent_id))];

    let recentParents: any[] = [];
    if (allSubParentIds.length > 0) {
      const { data } = await supabase
        .from("parents")
        .select("id, name, email, phone, created_at")
        .is("deleted_at", null)
        .not("id", "in", `(${allSubParentIds.join(",")})`)
        .order("created_at", { ascending: false })
        .limit(50);
      recentParents = data || [];
    } else {
      const { data } = await supabase
        .from("parents")
        .select("id, name, email, phone, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      recentParents = data || [];
    }

    // 3. Get pending payments for trial parents
    let pendingPaymentsMap: Record<string, any> = {};
    if (allSubParentIds.length > 0) {
      const { data: pendingPp } = await supabase
        .from("parent_payments")
        .select("*")
        .in("parent_id", allSubParentIds)
        .eq("status", "pending");

      for (const pp of pendingPp || []) {
        if (!pendingPaymentsMap[pp.parent_id]) pendingPaymentsMap[pp.parent_id] = pp;
      }
    }

    // 4. Get children counts for ALL parents involved
    const allParentIds = [
      ...new Set([
        ...allSubParentIds,
        ...(recentParents || []).map((p: any) => p.id),
      ]),
    ];

    let childrenCountMap: Record<string, number> = {};
    if (allParentIds.length > 0) {
      const { data: links } = await supabase
        .from("parent_student_links")
        .select("parent_id")
        .in("parent_id", allParentIds);

      for (const link of links || []) {
        childrenCountMap[link.parent_id] = (childrenCountMap[link.parent_id] || 0) + 1;
      }
    }

    // 5. Build response
    const approvals: any[] = [];

    for (const sub of trialParents || []) {
      const s = sub as any;
      const parent = s.parent;
      const pendingPayment = pendingPaymentsMap[parent.id];
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(parent.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      let paymentStatus: "paid" | "unpaid" | "pending_verification" = "unpaid";
      if (pendingPayment) paymentStatus = "pending_verification";
      else if (s.status === "active") paymentStatus = "paid";

      const urgencyScore = Math.min(10,
        daysSinceCreated + (s.plan?.amount_monthly > 0 ? 3 : 0)
      );

      approvals.push({
        id: s.id,
        parent_id: parent.id,
        parent_name: parent.name || "Unknown",
        parent_email: parent.email || "",
        parent_phone: parent.phone || "",
        children_count: childrenCountMap[parent.id] || 0,
        plan_selected: s.plan?.code || "free",
        plan_type_id: s.plan?.id || 1,
        payment_status: paymentStatus,
        payment_proof_url: pendingPayment?.payment_id
          ? `/api/admin/payments/proof/${pendingPayment.id}`
          : undefined,
        status: paymentStatus === "paid" ? "approved" : "pending",
        created_at: parent.created_at,
        urgency_score: urgencyScore,
      });
    }

    for (const parent of recentParents || []) {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(parent.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      approvals.push({
        id: parent.id,
        parent_id: parent.id,
        parent_name: parent.name || "Unknown",
        parent_email: parent.email || "",
        parent_phone: parent.phone || "",
        children_count: childrenCountMap[parent.id] || 0,
        plan_selected: "none",
        plan_type_id: 1,
        payment_status: "unpaid",
        status: "pending",
        created_at: parent.created_at,
        urgency_score: Math.min(10, daysSinceCreated),
      });
    }

    approvals.sort((a, b) => b.urgency_score - a.urgency_score);

    // 6. Add parent_registrations (pre-auth pending approvals)
    const { data: pendingRegs } = await supabase
      .from("parent_registrations")
      .select("id, parent_name, parent_email, parent_phone, child_name, created_at, status")
      .eq("status", "pending")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    for (const reg of pendingRegs || []) {
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(reg.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      approvals.push({
        id: reg.id,
        parent_id: reg.id,
        parent_name: reg.parent_name || "Unknown",
        parent_email: reg.parent_email || "",
        parent_phone: reg.parent_phone || "",
        children_count: 1,
        plan_selected: "pending_registration",
        plan_type_id: 1,
        payment_status: "unpaid",
        status: "pending",
        is_pre_auth: true,
        child_name: reg.child_name,
        created_at: reg.created_at,
        urgency_score: Math.min(10, daysSinceCreated + 5),
      });
    }

    // 7. Add school_registrations (pending school onboarding approvals)
    try {
      const { data: pendingSchools } = await supabase
        .from("school_registrations")
        .select("id, school_name, admin_name, admin_email, admin_phone, address, city, board_name, created_at, status")
        .eq("status", "pending")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      for (const reg of pendingSchools || []) {
        const daysSinceCreated = Math.floor(
          (Date.now() - new Date(reg.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        approvals.push({
          id: reg.id,
          parent_id: reg.id,
          parent_name: reg.admin_name || "Unknown",
          parent_email: reg.admin_email || "",
          parent_phone: reg.admin_phone || "",
          children_count: 0,
          plan_selected: "pending_school",
          plan_type_id: 3,
          payment_status: "unpaid",
          status: "pending",
          is_pre_auth: true,
          is_school: true,
          school_name: reg.school_name,
          address: reg.address,
          city: reg.city,
          board_name: reg.board_name,
          created_at: reg.created_at,
          urgency_score: Math.min(10, daysSinceCreated + 6),
        });
      }
    } catch (err) {
      console.warn("school_registrations query failed (might need migrations):", err);
    }

    return json({ data: approvals });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
