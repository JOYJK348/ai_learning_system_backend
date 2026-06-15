import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

// GET — List parents with subscription details
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");          // active | expired
    const planFilter = searchParams.get("plan");               // free | paid
    const regTypeFilter = searchParams.get("registration_type"); // individual | school

    const supabase = getSupabaseAdmin();

    // Fetch subscriptions joined with parent + plan + payments
    let statusFilterArr: string[] = [];
    if (statusFilter === "active") statusFilterArr = ["active", "trial"];
    else if (statusFilter === "expired") statusFilterArr = ["expired", "cancelled"];

    // Fetch all subscriptions and filter in memory to avoid Supabase query type issues
    let subs: any[] | null = null;
    let subsError: string | null = null;

    try {
      const { data, error } = await supabase
        .from("parent_subscriptions")
        .select(`
          *,
          parent:parents!inner(id, name, email, phone, created_at, registration_type, school_id),
          plan:plans!inner(id, code, name, amount_monthly)
        `)
        .order("created_at", { ascending: false });

      if (error) subsError = error.message;
      else subs = data;
    } catch (err: any) {
      subsError = err.message || "Query failed";
      console.error("[parents/plans] catch error:", err);
    }

    if (subsError) {
      console.error("[parents/plans] subsError:", subsError);
      return json({ error: subsError }, 500);
    }

    // Step 1: Determine which parents have school-linked children (from ALL data)
    let schoolParentIds = new Set<string>();
    try {
      const { data: allSchoolStudents } = await supabase
        .from("school_students")
        .select("student_id")
        .is("deleted_at", null);
      const schoolStudentIds = new Set((allSchoolStudents || []).map((ss: any) => ss.student_id));

      if (schoolStudentIds.size > 0) {
        const { data: pslData } = await supabase
          .from("parent_student_links")
          .select("parent_id, student_id")
          .in("student_id", [...schoolStudentIds])
          .is("deleted_at", null);
        for (const link of pslData || []) {
          schoolParentIds.add(link.parent_id);
        }
      }
    } catch {}

    // Step 2: Override registration_type on ALL subs before filtering
    for (const sub of subs || []) {
      if (sub.parent && schoolParentIds.has(sub.parent.id)) {
        sub.parent.registration_type = "school";
      }
    }

    // Step 3: Apply filters in memory (regTypeFilter now sees corrected registration_type)
    let filtered: any[] = subs || [];
    if (statusFilterArr.length > 0) {
      filtered = filtered.filter((s: any) => statusFilterArr.includes(s.status));
    }
    if (regTypeFilter === "individual") {
      filtered = filtered.filter((s: any) => s.parent?.registration_type === "individual" || !s.parent?.registration_type);
    } else if (regTypeFilter === "school") {
      filtered = filtered.filter((s: any) => s.parent?.registration_type === "school");
    }
    if (planFilter === "free") {
      // Free = Free plan subscribers + parents with NO subscription at all
      const subscribedIds = new Set((subs || []).map((s: any) => s.parent_id));
      const freeSubscribers = filtered.filter((s: any) => s.plan_id === 1);

      let unsubscribedParents: any[] = [];
      try {
        let query = supabase
          .from("parents")
          .select("id, name, email, phone, created_at, registration_type, school_id")
          .is("deleted_at", null);
        const { data } = await query.order("created_at", { ascending: false }).limit(200);
        unsubscribedParents = data || [];
      } catch {}

      // Override registration_type for unsubscribed parents too, then filter
      for (const p of unsubscribedParents) {
        if (schoolParentIds.has(p.id)) {
          p.registration_type = "school";
        }
      }
      let filteredUnsubscribed = unsubscribedParents;
      if (regTypeFilter === "individual") {
        filteredUnsubscribed = filteredUnsubscribed.filter((p: any) => p.registration_type === "individual" || !p.registration_type);
      } else if (regTypeFilter === "school") {
        filteredUnsubscribed = filteredUnsubscribed.filter((p: any) => p.registration_type === "school");
      }

      const unsubscribed = (filteredUnsubscribed || [])
        .filter((p: any) => !subscribedIds.has(p.id))
        .map((p: any) => ({
          id: p.id,
          parent_id: p.id,
          status: "inactive",
          start_date: p.created_at,
          end_date: null,
          plan_id: 1,
          parent: { id: p.id, name: p.name, email: p.email, phone: p.phone, created_at: p.created_at, registration_type: p.registration_type || "individual", school_id: p.school_id || null },
          plan: { id: 1, code: "free", name: "Free", amount_monthly: 0 },
        }));

      filtered = [...freeSubscribers, ...unsubscribed];
    } else if (planFilter === "paid") {
      filtered = filtered.filter((s: any) => s.plan_id > 1);
    }

    // Fetch parent_payments grouped by parent_id for totals + children count
    const parentIds = [...new Set((filtered || []).map((s: any) => s.parent_id))];
    let paymentsMap: Record<string, any[]> = {};
    let childrenCountMap: Record<string, number> = {};

    if (parentIds.length > 0) {
      const [ppsResult, linksResult] = await Promise.all([
        supabase
          .from("parent_payments")
          .select("*")
          .in("parent_id", parentIds)
          .eq("status", "success")
          .order("confirmed_at", { ascending: false }),
        supabase
          .from("parent_student_links")
          .select("parent_id")
          .in("parent_id", parentIds),
      ]);

      for (const pp of ppsResult.data || []) {
        if (!paymentsMap[pp.parent_id]) paymentsMap[pp.parent_id] = [];
        paymentsMap[pp.parent_id].push(pp);
      }

      for (const link of linksResult.data || []) {
        childrenCountMap[link.parent_id] = (childrenCountMap[link.parent_id] || 0) + 1;
      }
    }

    const parents = (filtered || []).map((sub: any) => {
      const parent = sub.parent;
      const plan = sub.plan;
      const pp = paymentsMap[parent.id] || [];
      const totalPaid = pp.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
      const lastPayment = pp[0];

      const now = new Date();
      const endDate = sub.end_date ? new Date(sub.end_date) : null;
      const daysUntilExpiry = endDate
        ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let churnRisk: "low" | "medium" | "high" = "low";
      if (daysUntilExpiry <= 7 && daysUntilExpiry >= 0) churnRisk = "high";
      else if (daysUntilExpiry <= 14) churnRisk = "medium";

      const statusMap: Record<string, "active" | "inactive" | "expired" | "grace_period"> = {
        active: "active",
        trial: "active",
        expired: "expired",
        cancelled: "expired",
      };

      return {
        id: sub.id,
        parent_id: parent.id,
        parent_name: parent.name || "Unknown",
        parent_email: parent.email || "",
        parent_phone: parent.phone || "",
        registration_type: parent.registration_type || "individual",
        school_id: parent.school_id || null,
        plan_type: plan?.code || "free",
        plan_name: plan?.name || "Free",
        plan_price: Number(plan?.amount_monthly || 0),
        status: statusMap[sub.status] || "inactive",
        plan_start_date: sub.start_date,
        plan_end_date: sub.end_date,
        days_until_expiry: daysUntilExpiry,
        total_paid: totalPaid,
        last_payment_date: lastPayment?.confirmed_at || null,
        children_count: childrenCountMap[parent.id] || 0,
        churn_risk: churnRisk,
      };
    });

    return json({ data: parents });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}

// PUT — Upgrade/downgrade plan (creates new subscription)
export async function PUT(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const body = await req.json();
    const { parent_id, plan_type_id } = body;

    if (!parent_id || !plan_type_id) {
      return json({ error: "Parent ID and plan_type_id required" }, 400);
    }

    const supabase = getSupabaseAdmin();

    // Get current subscription
    const { data: currentSub } = await supabase
      .from("parent_subscriptions")
      .select("id, plan_id")
      .eq("parent_id", parent_id)
      .in("status", ["active", "trial"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Cancel old subscription
    if (currentSub) {
      await supabase
        .from("parent_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentSub.id);
    }

    // Create new subscription
    const now = new Date();
    const durationDays = plan_type_id >= 2 ? 365 : 0;
    const endDate = durationDays > 0
      ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const { data: newSub, error } = await supabase
      .from("parent_subscriptions")
      .insert({
        parent_id,
        plan_id: plan_type_id,
        status: "active",
        start_date: now.toISOString(),
        end_date: endDate?.toISOString() || null,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, 500);

    // Update parents table for backward compat
    await supabase
      .from("parents")
      .update({
        plan_type_id,
        plan_status_id: 1,
        plan_started_at: now.toISOString(),
        plan_expires_at: endDate?.toISOString() || null,
        updated_at: now.toISOString(),
      })
      .eq("id", parent_id);

    // Log to admin activity logs
    await supabase.from("admin_activity_logs").insert({
      admin_id: user!.profileId,
      action_id: 2,
      entity_type: "parents",
      entity_id: parent_id,
      details: {
        action: "plan_upgrade",
        old_plan_id: currentSub?.plan_id ?? null,
        new_plan_id: plan_type_id,
      },
    });

    return json({ data: newSub, message: "Plan updated" });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}
