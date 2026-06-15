import { NextRequest } from "next/server";
import { json, requireSchoolAdmin } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { user, planExpired } = await requireSchoolAdmin(req);
  if (planExpired) return json({ error: "plan_expired", message: "Your 14-day trial has ended. Please contact support to renew your plan." }, 403);
  if (!user) return json({ error: "Forbidden" }, 403);

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const schoolId = user.schoolId;

    const { data: school, error: schoolError } = await supabaseAdmin
      .from("schools")
      .select(`
        id,name,plan_type_id,plan_status_id,plan_started_at,plan_expires_at,
        max_students,max_teachers,
        plan_price,setup_fee,discount_percent,trial_days,features,
        revenue_this_month,revenue_total
      `)
      .eq("id", schoolId)
      .is("deleted_at", null)
      .maybeSingle();

    if (schoolError) return json({ error: schoolError.message }, 500);
    if (!school) return json({ error: "School not found" }, 404);

    const [{ data: planType }, { data: planStatus }] = await Promise.all([
      supabaseAdmin
        .from("lookup_plan_types")
        .select("code,name")
        .eq("id", school.plan_type_id)
        .maybeSingle(),
      supabaseAdmin
        .from("lookup_plan_status")
        .select("code,name,color")
        .eq("id", school.plan_status_id)
        .maybeSingle(),
    ]);

    const { count: studentCount } = await supabaseAdmin
      .from("school_students")
      .select("*", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .is("deleted_at", null);

    const { data: paymentRows } = await supabaseAdmin
      .from("payments")
      .select(`
        id,amount,currency,plan_name_snapshot,
        payment_method_id,payment_status_id,
        gateway_name,notes,paid_at,created_at
      `)
      .eq("school_id", schoolId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    const methodIds = [
      ...new Set((paymentRows || []).map((r) => r.payment_method_id).filter(Boolean)),
    ];
    const statusIds = [
      ...new Set((paymentRows || []).map((r) => r.payment_status_id).filter(Boolean)),
    ];

    const [methodLookup, statusLookup] = await Promise.all([
      methodIds.length > 0
        ? supabaseAdmin
            .from("lookup_payment_methods")
            .select("id,code,name")
            .in("id", methodIds)
        : { data: [] },
      statusIds.length > 0
        ? supabaseAdmin
            .from("lookup_payment_status")
            .select("id,code,name,color")
            .in("id", statusIds)
        : { data: [] },
    ]);

    const methodMap = new Map(
      (methodLookup.data || []).map((m: { id: number; code: string; name: string }) => [m.id, m])
    );
    const statusMap = new Map(
      (statusLookup.data || []).map((s: { id: number; code: string; name: string; color: string }) => [s.id, s])
    );

    const transactions = (paymentRows || []).map((p) => {
      const pm = p.payment_method_id ? methodMap.get(p.payment_method_id) : null;
      const ps = p.payment_status_id ? statusMap.get(p.payment_status_id) : null;
      return {
        id: p.id,
        amount: Number(p.amount),
        currency: p.currency,
        plan_name_snapshot: p.plan_name_snapshot,
        payment_method: pm?.name ?? null,
        payment_method_code: pm?.code ?? null,
        payment_status: ps?.code ?? null,
        payment_status_name: ps?.name ?? null,
        payment_status_color: ps?.color ?? null,
        gateway_name: p.gateway_name,
        notes: p.notes,
        paid_at: p.paid_at,
        created_at: p.created_at,
      };
    });

    const now = new Date();
    const expiresAt = school.plan_expires_at ? new Date(school.plan_expires_at) : null;
    const daysRemaining = expiresAt
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const planCode = planType?.code;
    const isFree = planCode === 'free';
    const planPrice = isFree ? 0 : Number(school.plan_price || 0);
    const setupFee = isFree ? 0 : Number(school.setup_fee || 0);
    const discountPct = isFree ? 0 : Number(school.discount_percent || 0);
    const currentStudents = studentCount ?? 0;

    const features = school.features ?? {};
    const cleanedFeatures: Record<string, boolean> = {
      videos: !!features.videos,
      quizzes: !!features.quizzes,
      activities: !!features.activities,
      reports: !isFree && !!features.reports,
      ai_tutor: false,
      bulk_import: false,
    };
    if (planCode === 'paid') {
      cleanedFeatures.bulk_import = !!features.bulk_import;
    }
    if (planCode === 'school') {
      cleanedFeatures.ai_tutor = !!features.ai_tutor;
      cleanedFeatures.bulk_import = !!features.bulk_import;
    }

    return json({
      data: {
        subscription: {
          plan_type: planType?.code ?? null,
          plan_type_name: planType?.name ?? null,
          plan_status: planStatus?.code ?? null,
          plan_status_name: planStatus?.name ?? null,
          plan_status_color: planStatus?.color ?? null,
          plan_started_at: school.plan_started_at,
          plan_expires_at: school.plan_expires_at,
          days_remaining: daysRemaining,
          plan_price: planPrice,
          setup_fee: setupFee,
          discount_percent: discountPct,
          trial_days: school.trial_days,
          features: cleanedFeatures,
          max_students: school.max_students,
          max_teachers: school.max_teachers,
        },
        usage: {
          current_students: currentStudents,
          max_students: school.max_students,
          usage_percent: school.max_students > 0
            ? Math.round((currentStudents / school.max_students) * 100)
            : 0,
        },
        transactions,
        revenue: {
          this_month: Number(school.revenue_this_month || 0),
          total: Number(school.revenue_total || 0),
        },
        server_time: now.toISOString(),
      },
    });
  } catch (err) {
    console.error("GET /api/school-admin/payments error:", err);
    return json({ error: "Internal server error" }, 500);
  }
}
