import { NextRequest } from "next/server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type RecentSignup = {
  name: string;
  role: "Parent" | "Student" | "School";
  status: string;
  created_at: string;
};

function sumAmounts(rows: Array<{ amount: number | string | null }> | null) {
  return (rows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

function normalizeSeries(values: number[]) {
  const recentValues = values.slice(-7);
  const max = Math.max(...recentValues, 1);
  const normalized = recentValues.map((value) => Math.max(4, Math.round((value / max) * 96)));
  return normalized.length > 1 ? normalized : [0, ...normalized];
}

function lastThirtyDateKeys() {
  const dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!requireRole(user, ["super_admin"])) return json({ error: "Forbidden" }, 403);

  try {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      studentsCountRes,
      parentsCountRes,
      schoolsCountRes,
      activeSchoolsRes,
      lessonsCountRes,
      newParentsRes,
      parentsActivityRes,
      totalRevenueRes,
      monthRevenueRes,
      revenueTrendRes,
      pendingPaymentsRes,
      pendingApprovalsRes,
      parentRegistrationsPendingRes,
      parentExpiringRes,
      schoolExpiringRes,
      lessonProgressRes,
      completedProgressRes,
      quizScoresRes,
      recentParentsRes,
      recentStudentsRes,
      recentSchoolsRes
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("parents").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("schools").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("schools").select("*", { count: "exact", head: true }).eq("status_id", 1).is("deleted_at", null),
      supabase.from("lessons").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.from("parents").select("*", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo).is("deleted_at", null),
      supabase.from("parents").select("updated_at").is("deleted_at", null),
      supabase.from("payments").select("amount").eq("payment_status_id", 2).is("deleted_at", null),
      supabase.from("payments").select("amount").eq("payment_status_id", 2).gte("paid_at", monthStart).is("deleted_at", null),
      supabase
        .from("payments")
        .select("amount, paid_at")
        .eq("payment_status_id", 2)
        .gte("paid_at", thirtyDaysAgo)
        .not("paid_at", "is", null)
        .is("deleted_at", null)
        .order("paid_at", { ascending: true }),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("payment_status_id", 1).is("deleted_at", null),
      supabase.from("parents").select("*", { count: "exact", head: true }).eq("approval_status_id", 1).is("deleted_at", null),
      supabase.from("parent_registrations").select("*", { count: "exact", head: true }).eq("status", "pending").is("deleted_at", null),
      supabase
        .from("parents")
        .select("*", { count: "exact", head: true })
        .eq("plan_status_id", 1)
        .lte("plan_expires_at", sevenDaysLater)
        .gt("plan_expires_at", now.toISOString())
        .is("deleted_at", null),
      supabase
        .from("schools")
        .select("*", { count: "exact", head: true })
        .lte("plan_expires_at", sevenDaysLater)
        .gt("plan_expires_at", now.toISOString())
        .is("deleted_at", null),
      supabase.from("lesson_progress").select("student_id,time_spent_seconds,last_accessed_at").gte("last_accessed_at", thirtyDaysAgo),
      supabase.from("lesson_progress").select("*", { count: "exact", head: true }).eq("status", "completed").is("deleted_at", null),
      supabase.from("quiz_attempts").select("percentage").not("percentage", "is", null).is("deleted_at", null),
      supabase
        .from("parents")
        .select("name,email,plan_type_id,created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("students")
        .select("full_name,created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("schools")
        .select("name,created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    const failed = [
      studentsCountRes,
      parentsCountRes,
      schoolsCountRes,
      activeSchoolsRes,
      lessonsCountRes,
      newParentsRes,
      parentsActivityRes,
      totalRevenueRes,
      monthRevenueRes,
      revenueTrendRes,
      pendingPaymentsRes,
      pendingApprovalsRes,
      parentRegistrationsPendingRes,
      parentExpiringRes,
      schoolExpiringRes,
      lessonProgressRes,
      completedProgressRes,
      quizScoresRes,
      recentParentsRes,
      recentStudentsRes,
      recentSchoolsRes
    ].find((result) => result.error);

    if (failed?.error) return json({ error: failed.error.message }, 500);

    const revenueByDate: Record<string, number> = {};
    (revenueTrendRes.data || []).forEach((payment) => {
      if (!payment.paid_at) return;
      const key = payment.paid_at.split("T")[0];
      revenueByDate[key] = (revenueByDate[key] || 0) + Number(payment.amount || 0);
    });

    const activityByDate: Record<string, number> = {};
    const activeStudentIds = new Set<string>();
    const totalSeconds = (lessonProgressRes.data || []).reduce((sum, row) => {
      if (row.student_id) activeStudentIds.add(row.student_id);
      if (row.last_accessed_at) {
        const key = row.last_accessed_at.split("T")[0];
        activityByDate[key] = (activityByDate[key] || 0) + 1;
      }
      return sum + Number(row.time_spent_seconds || 0);
    }, 0);

    const dates = lastThirtyDateKeys();
    const revenueSeries = dates.map((date) => revenueByDate[date] || 0);
    const activitySeries = dates.map((date) => activityByDate[date] || 0);

    const parentActiveCount = (parentsActivityRes.data || []).filter(
      (parent) => parent.updated_at && parent.updated_at >= thirtyDaysAgo
    ).length;
    const churnedParents = (parentsActivityRes.data || []).filter(
      (parent) => parent.updated_at && parent.updated_at < sixtyDaysAgo
    ).length;

    const quizScores = quizScoresRes.data || [];
    const avgQuizScore =
      quizScores.length > 0
        ? Math.round(quizScores.reduce((sum, row) => sum + Number(row.percentage || 0), 0) / quizScores.length)
        : 0;
    const completionRate =
      lessonsCountRes.count && lessonsCountRes.count > 0
        ? Math.round(((completedProgressRes.count || 0) / lessonsCountRes.count) * 100)
        : 0;
    const avgSessionMinutes =
      lessonProgressRes.data && lessonProgressRes.data.length > 0
        ? Math.round(totalSeconds / 60 / lessonProgressRes.data.length)
        : 0;

    const recentSignups: RecentSignup[] = [
      ...(recentParentsRes.data || []).map((parent) => ({
        name: parent.name || parent.email || "Parent",
        role: "Parent" as const,
        status: parent.plan_type_id === 2 ? "Paid" : "Free",
        created_at: parent.created_at
      })),
      ...(recentStudentsRes.data || []).map((student) => ({
        name: student.full_name || "Student",
        role: "Student" as const,
        status: "Active",
        created_at: student.created_at
      })),
      ...(recentSchoolsRes.data || []).map((school) => ({
        name: school.name || "School",
        role: "School" as const,
        status: "Active",
        created_at: school.created_at
      }))
    ]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const totalRevenue = sumAmounts(totalRevenueRes.data);
    const monthRevenue = sumAmounts(monthRevenueRes.data);
    const previousThirtyRevenue = totalRevenue - sumAmounts(revenueTrendRes.data || []);
    const growthPercent =
      previousThirtyRevenue > 0
        ? Math.round(((sumAmounts(revenueTrendRes.data || []) - previousThirtyRevenue) / previousThirtyRevenue) * 100)
        : 0;

    return json({
      data: {
        counts: {
          students: studentsCountRes.count || 0,
          parents: parentsCountRes.count || 0,
          schools: schoolsCountRes.count || 0,
          active_schools: activeSchoolsRes.count || 0,
          lessons: lessonsCountRes.count || 0
        },
        revenue: {
          total: totalRevenue,
          this_month: monthRevenue,
          growth_percent: growthPercent,
          trend: normalizeSeries(revenueSeries)
        },
        engagement: {
          active_users: activeStudentIds.size + parentActiveCount,
          churned_users: churnedParents,
          lessons_completed: completedProgressRes.count || 0,
          completion_rate: completionRate,
          avg_quiz_score: avgQuizScore,
          engagement_score: Math.round((completionRate + avgQuizScore) / 2),
          avg_session_minutes: avgSessionMinutes,
          activity_trend: normalizeSeries(activitySeries)
        },
        alerts: {
          pending_approvals: (pendingApprovalsRes.count || 0) + (parentRegistrationsPendingRes.count || 0),
          pending_payments: pendingPaymentsRes.count || 0,
          expiring_plans: (parentExpiringRes.count || 0) + (schoolExpiringRes.count || 0)
        },
        recent_signups: recentSignups,
        new_signups_30d: newParentsRes.count || 0
      }
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Failed to load dashboard" }, 500);
  }
}
