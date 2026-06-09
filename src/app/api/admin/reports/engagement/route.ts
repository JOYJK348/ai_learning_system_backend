import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getCurrentUser, json, requireRole } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user || !requireRole(user, ["super_admin"])) {
    return json({ error: "Forbidden" }, 403);
  }

  try {
    const supabase = getSupabaseAdmin();
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Real table: lesson_progress (not student_progress)
    // Real column: time_spent_seconds (not minutes), status (not completed bool)
    const { data: sessionData, error: sessionError } = await supabase
      .from("lesson_progress")
      .select("time_spent_seconds, last_accessed_at")
      .gte("last_accessed_at", thirtyDaysAgo);

    if (sessionError) return json({ error: sessionError.message }, 500);

    const totalSeconds =
      (sessionData || []).reduce(
        (sum: number, s: any) => sum + (s.time_spent_seconds || 0),
        0
      );
    const totalMinutes = Math.round(totalSeconds / 60);
    const avgSession =
      (sessionData || []).length > 0
        ? Math.round(totalMinutes / (sessionData || []).length)
        : 0;

    // Total lessons
    const { count: totalLessonsCount } = await supabase
      .from("lessons")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    // Completed lesson_progress rows (status='completed')
    const { count: completedCount } = await supabase
      .from("lesson_progress")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .is("deleted_at", null);

    const totalLessons = totalLessonsCount || 0;
    const completed = completedCount || 0;
    const completionRate =
      totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

    // Quiz scores from quiz_attempts (real table, real column: percentage)
    const { data: quizScores, error: quizError } = await supabase
      .from("quiz_attempts")
      .select("percentage")
      .not("percentage", "is", null)
      .is("deleted_at", null);

    if (quizError) return json({ error: quizError.message }, 500);

    const safeScores = quizScores || [];
    const avgQuizScore =
      safeScores.length > 0
        ? Math.round(
            safeScores.reduce(
              (sum: number, q: any) => sum + (q.percentage || 0),
              0
            ) / safeScores.length
          )
        : 0;

    // Daily activity heatmap
    const dailyActivity: Record<string, number> = {};
    (sessionData || []).forEach((s: any) => {
      if (s.last_accessed_at) {
        const date = s.last_accessed_at.split("T")[0];
        dailyActivity[date] = (dailyActivity[date] || 0) + 1;
      }
    });

    const dates = Object.keys(dailyActivity).sort();
    const activity = dates.map((d) => dailyActivity[d]);

    return json({
      data: {
        avg_session_minutes: avgSession,
        completion_rate: completionRate,
        avg_quiz_score: avgQuizScore,
        total_time_spent_hours: Math.round(totalSeconds / 3600),
        daily_activity: { dates, activity },
        engagement_score: Math.round((completionRate + avgQuizScore) / 2),
      },
    });
  } catch (error: any) {
    return json({ error: error.message || "Internal Server Error" }, 500);
  }
}