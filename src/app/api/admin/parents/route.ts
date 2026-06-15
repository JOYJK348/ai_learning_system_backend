import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

async function requireAdmin(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin", "school_admin"])) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const url = new URL(req.url);
    const includeDeleted = url.searchParams.get("include_deleted") === "true";

    let query = supabaseAdmin
      .from("parents")
      .select(
        "id,name,email,phone,profile_photo_url,plan_type_id,plan_status_id,approval_status_id,status_id,plan_expires_at,plan_started_at,registered_at,created_at"
      )
      .order("created_at", { ascending: false });

    if (!includeDeleted) query = query.is("deleted_at", null);
    if (user.role === "school_admin" && user.schoolId) {
      query = query.eq("school_id", user.schoolId);
    } else {
      // Only show individual (non-school) parents in admin panel
      query = query.is("school_id", null);
    }

    const { data: parents, error: parentsError } = await query;
    if (parentsError) return json({ error: parentsError.message }, 500);

    const parentIds = (parents || []).map((p) => p.id).filter(Boolean) as string[];

    // Get start/end of current month for revenue
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const [
      planTypesRes,
      planStatusRes,
      approvalStatusRes,
      linksRes,
      paymentsRes,
      monthlyRevenueRes,
    ] = await Promise.all([
      supabaseAdmin.from("lookup_plan_types").select("id,code,name"),
      supabaseAdmin.from("lookup_plan_status").select("id,code,name,color"),
      supabaseAdmin.from("lookup_approval_status").select("id,code,name,color"),
      parentIds.length > 0
        ? supabaseAdmin
            .from("parent_student_links")
            .select("parent_id,student_id,students(full_name)")
            .in("parent_id", parentIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] as any[], error: null }),
      // Latest payment per parent
      parentIds.length > 0
        ? supabaseAdmin
            .from("payments")
            .select("parent_id,amount,payment_status_id,paid_at")
            .in("parent_id", parentIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as any[], error: null }),
      // Monthly revenue (success payments this month)
      supabaseAdmin
        .from("payments")
        .select("amount,currency")
        .eq("payment_status_id", 2) // success
        .gte("paid_at", monthStart)
        .lte("paid_at", monthEnd),
    ]);

    // Build lookup maps
    const planTypeMap: Record<number, { code: string; name: string }> = {};
    (planTypesRes.data || []).forEach(pt => { planTypeMap[pt.id] = { code: pt.code, name: pt.name }; });

    const planStatusMap: Record<number, { code: string; name: string; color: string }> = {};
    (planStatusRes.data || []).forEach(ps => { planStatusMap[ps.id] = { code: ps.code, name: ps.name, color: ps.color }; });

    const approvalStatusMap: Record<number, { code: string; name: string; color: string }> = {};
    (approvalStatusRes.data || []).forEach(aps => { approvalStatusMap[aps.id] = { code: aps.code, name: aps.name, color: aps.color }; });

    // Children maps
    const childrenCountMap: Record<string, number> = {};
    const childrenNamesMap: Record<string, string[]> = {};
    (linksRes.data || []).forEach((link: any) => {
      childrenCountMap[link.parent_id] = (childrenCountMap[link.parent_id] || 0) + 1;
      if (!childrenNamesMap[link.parent_id]) childrenNamesMap[link.parent_id] = [];
      if (link.students?.full_name) childrenNamesMap[link.parent_id].push(link.students.full_name);
    });

    // Latest payment per parent map
    const latestPaymentMap: Record<string, { amount: number; status_id: number; paid_at: string | null }> = {};
    (paymentsRes.data || []).forEach((pay: any) => {
      if (!latestPaymentMap[pay.parent_id]) {
        latestPaymentMap[pay.parent_id] = {
          amount: pay.amount,
          status_id: pay.payment_status_id,
          paid_at: pay.paid_at,
        };
      }
    });

    // Monthly revenue total
    const monthlyRevenue = (monthlyRevenueRes.data || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

    const enriched = (parents || []).map((parent) => {
      const approval = parent.approval_status_id ? approvalStatusMap[parent.approval_status_id] : null;
      const planType = parent.plan_type_id ? planTypeMap[parent.plan_type_id] : null;
      const planStatus = parent.plan_status_id ? planStatusMap[parent.plan_status_id] : null;
      const latestPayment = latestPaymentMap[parent.id];

      const expiresAt = parent.plan_expires_at ? new Date(parent.plan_expires_at) : null;
      const daysUntilExpiry = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

      return {
        ...parent,
        plan_name: planType?.name ?? "Free",
        plan_code: planType?.code ?? "free",
        plan_status_name: planStatus?.name ?? null,
        plan_status_code: planStatus?.code ?? null,
        plan_status_color: planStatus?.color ?? null,
        approval_status_name: approval?.name ?? "Approved",
        approval_status_code: approval?.code ?? "approved",
        approval_status_color: approval?.color ?? "#22C55E",
        children_count: childrenCountMap[parent.id] || 0,
        children_names: childrenNamesMap[parent.id] || [],
        latest_payment_amount: latestPayment?.amount ?? null,
        latest_payment_status_id: latestPayment?.status_id ?? null,
        latest_payment_paid_at: latestPayment?.paid_at ?? null,
        days_until_expiry: daysUntilExpiry,
      };
    });

    return json({
      data: enriched,
      meta: {
        monthly_revenue: Math.round(monthlyRevenue),
        currency: "INR",
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load parents" }, 500);
  }
}
